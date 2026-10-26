-- 주문 받기 스위치: storeOpen=true 이고 계좌번호·사업자번호가 모두 있어야 손님 주문을 받는다.
-- 관리자는 닫힌 상태에서도 테스트 주문 가능. 가격·배송비·마감·품절은 전부 서버에서 다시 계산한다.

create or replace function public.store_is_open() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((data->>'storeOpen')::boolean, false)
     and length(coalesce(data->>'bankAccount','')) > 0
     and length(coalesce(data->>'businessNumber','')) > 0
  from public.store_settings where id = 1;
$$;
grant execute on function public.store_is_open() to anon, authenticated;

create or replace function public.place_order(
  p_items jsonb, p_recipient text, p_phone text, p_address text, p_memo text, p_depositor text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_prod record;
  v_opt jsonb;
  v_size jsonb;
  v_qty integer;
  v_price integer;
  v_subtotal integer := 0;
  v_ship integer;
  v_threshold integer;
  v_fee integer;
  v_settings jsonb;
  v_phone text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  v_order_id uuid;
  v_order_no text;
  v_lines jsonb := '[]'::jsonb;
  v_img text;
begin
  if not coalesce(public.store_is_open(), false) and not public.is_admin() then
    raise exception '지금은 주문을 받지 않고 있습니다. 오픈 공지를 확인해주세요.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '장바구니가 비어 있습니다.';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception '한 번에 주문할 수 있는 옵션은 50개까지입니다.'; end if;
  if length(trim(coalesce(p_recipient,''))) = 0 or length(p_recipient) > 50 then raise exception '수령인 이름을 확인해주세요.'; end if;
  if v_phone !~ '^01[0-9]{8,9}$' then raise exception '연락처를 010-1234-5678 형식으로 확인해주세요.'; end if;
  if length(trim(coalesce(p_address,''))) < 5 or length(p_address) > 300 then raise exception '배송지 주소를 확인해주세요.'; end if;
  if length(trim(coalesce(p_depositor,''))) = 0 or length(p_depositor) > 50 then raise exception '입금자명을 입력해주세요.'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception '수량을 확인해주세요.'; end if;

    select * into v_prod from public.products where id = v_item->>'productId' and active;
    if not found then raise exception '판매가 끝났거나 없는 상품이 있습니다. 장바구니에서 삭제 후 다시 주문해주세요.'; end if;
    if v_prod.groupbuy_ends_at is not null and v_prod.groupbuy_ends_at < now() then
      raise exception '%: 공구가 마감되었습니다.', v_prod.data->>'name';
    end if;

    v_img := v_prod.data->>'image';
    if jsonb_array_length(coalesce(v_prod.data->'options','[]'::jsonb)) > 0 then
      select o into v_opt from jsonb_array_elements(v_prod.data->'options') o where o->>'color' = v_item->>'color' limit 1;
      if v_opt is null then raise exception '%: 색상을 다시 선택해주세요.', v_prod.data->>'name'; end if;
      select s into v_size from jsonb_array_elements(v_opt->'sizes') s where s->>'size' = v_item->>'size' limit 1;
      if v_size is null then raise exception '%: 사이즈를 다시 선택해주세요.', v_prod.data->>'name'; end if;
      if coalesce((v_size->>'stock')::integer, 0) <= 0 then
        raise exception '% (% / %) 옵션이 품절되었습니다.', v_prod.data->>'name', v_item->>'color', v_item->>'size';
      end if;
      v_img := coalesce(nullif(v_opt->>'image',''), v_img);
    end if;

    v_price := coalesce(nullif((v_prod.data->>'discountPrice')::integer, 0), (v_prod.data->>'consumerPrice')::integer);
    if v_price is null or v_price <= 0 then raise exception '%: 가격 정보가 없습니다.', v_prod.data->>'name'; end if;
    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_prod.id, 'product_name', v_prod.data->>'name',
      'color', v_item->>'color', 'size', v_item->>'size', 'image', v_img,
      'unit_price', v_price, 'quantity', v_qty);
  end loop;

  select data into v_settings from public.store_settings where id = 1;
  v_threshold := coalesce((v_settings->>'freeShippingThreshold')::integer, 50000);
  v_fee := coalesce((v_settings->>'shippingFee')::integer, 3000);
  v_ship := case when v_threshold > 0 and v_subtotal >= v_threshold then 0 else v_fee end;

  loop
    v_order_no := to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.orders where order_no = v_order_no);
  end loop;

  insert into public.orders (order_no, recipient, phone, address, memo, depositor_name, subtotal, shipping_fee, total)
  values (v_order_no, trim(p_recipient), v_phone, trim(p_address), nullif(trim(coalesce(p_memo,'')), ''), trim(p_depositor),
          v_subtotal, v_ship, v_subtotal + v_ship)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, color, size, image, unit_price, quantity)
  select v_order_id, l->>'product_id', l->>'product_name', l->>'color', l->>'size', l->>'image',
         (l->>'unit_price')::int, (l->>'quantity')::int
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('orderNo', v_order_no, 'subtotal', v_subtotal, 'shippingFee', v_ship, 'total', v_subtotal + v_ship);
end; $$;

revoke all on function public.place_order(jsonb,text,text,text,text,text) from public;
grant execute on function public.place_order(jsonb,text,text,text,text,text) to anon, authenticated;
