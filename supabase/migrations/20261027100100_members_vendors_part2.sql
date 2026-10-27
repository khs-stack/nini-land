-- 니니랜드 2단계 (2/2): 거래 조건 비공개화, 주문·출고·정산

------------------------------------------------------------------------------
-- 3-1. 거래 조건(수수료율·거래방식)은 손님이 읽는 products 대신 비공개 product_costs로 옮긴다
------------------------------------------------------------------------------
alter table public.product_costs
  add column deal_type text not null default 'own' check (deal_type in ('own','commission','purchase')),
  add column commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  add column wholesale_commission_rate numeric(5,2) check (wholesale_commission_rate between 0 and 100);

insert into public.product_costs (product_id, supply_price, deal_type, commission_rate, wholesale_commission_rate)
select id, 0, deal_type, commission_rate, wholesale_commission_rate from public.products
on conflict (product_id) do update set deal_type = excluded.deal_type, commission_rate = excluded.commission_rate,
  wholesale_commission_rate = excluded.wholesale_commission_rate;

alter table public.products drop column deal_type, drop column commission_rate, drop column wholesale_commission_rate;

create or replace function public.approve_submission(p_submission uuid, p_terms jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  s public.product_submissions;
  v public.vendors;
  pl jsonb;
  pid text;
  v_publish boolean := coalesce((p_terms->>'publish')::boolean, false);
begin
  if not public.is_admin() then raise exception '관리자만 승인할 수 있습니다.'; end if;
  select * into s from public.product_submissions where id = p_submission for update;
  if not found or s.status <> 'pending' then raise exception '검수 대기 중인 신청이 아닙니다.'; end if;
  select * into v from public.vendors where id = s.vendor_id;
  pl := s.payload;

  if s.product_id is null then
    pid := coalesce(nullif(regexp_replace(lower(coalesce(pl->'data'->>'name','product')), '[^a-z0-9가-힣]+', '-', 'g'), ''), 'product')
           || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    insert into public.products (id, slug, data, active, groupbuy_ends_at, vendor_id, consumer_mode, wholesale_enabled, wholesale_audience, fulfillment, sort)
    values (pid, pid, (pl->'data') || jsonb_build_object('id', pid, 'slug', pid), v_publish,
            nullif(pl->>'groupbuyEndsAt','')::timestamptz, s.vendor_id,
            coalesce(pl->>'consumerMode','retail'), coalesce((pl->>'wholesaleEnabled')::boolean, false), coalesce(pl->>'wholesaleAudience','business'),
            coalesce(p_terms->>'fulfillment', pl->>'fulfillment', 'vendor'),
            (select coalesce(max(sort),0) + 1 from public.products));
  else
    pid := s.product_id;
    update public.products set
      data = (pl->'data') || jsonb_build_object('id', id, 'slug', slug),
      groupbuy_ends_at = nullif(pl->>'groupbuyEndsAt','')::timestamptz,
      consumer_mode = coalesce(pl->>'consumerMode', consumer_mode),
      wholesale_enabled = coalesce((pl->>'wholesaleEnabled')::boolean, wholesale_enabled),
      wholesale_audience = coalesce(pl->>'wholesaleAudience', wholesale_audience),
      fulfillment = coalesce(p_terms->>'fulfillment', fulfillment),
      active = case when p_terms ? 'publish' then v_publish else active end
    where id = pid;
  end if;

  if (pl->'wholesale'->>'price') is not null and (pl->'wholesale'->>'price')::int > 0 then
    insert into public.product_wholesale (product_id, price, min_qty, order_unit)
    values (pid, (pl->'wholesale'->>'price')::int, greatest(coalesce((pl->'wholesale'->>'minQty')::int,1),1), greatest(coalesce((pl->'wholesale'->>'orderUnit')::int,1),1))
    on conflict (product_id) do update set price = excluded.price, min_qty = excluded.min_qty, order_unit = excluded.order_unit;
  elsif coalesce((pl->>'wholesaleEnabled')::boolean, false) = false then
    delete from public.product_wholesale where product_id = pid;
  end if;

  insert into public.product_costs (product_id, supply_price, deal_type, commission_rate, wholesale_commission_rate)
  values (pid, greatest(coalesce((pl->>'supplyPrice')::int, 0), 0),
          coalesce(p_terms->>'dealType', v.default_deal_type),
          coalesce((p_terms->>'commissionRate')::numeric, v.default_commission_rate),
          nullif(p_terms->>'wholesaleCommissionRate','')::numeric)
  on conflict (product_id) do update set
    supply_price = case when pl ? 'supplyPrice' then excluded.supply_price else public.product_costs.supply_price end,
    deal_type = case when p_terms ? 'dealType' then excluded.deal_type else public.product_costs.deal_type end,
    commission_rate = case when p_terms ? 'commissionRate' then excluded.commission_rate else public.product_costs.commission_rate end,
    wholesale_commission_rate = case when p_terms ? 'wholesaleCommissionRate' then excluded.wholesale_commission_rate else public.product_costs.wholesale_commission_rate end;

  update public.product_submissions set status = 'approved', product_id = pid, reviewed_at = now(),
    review_note = nullif(p_terms->>'note','') where id = p_submission;
  return pid;
end; $$;

-- 반려
create or replace function public.reject_submission(p_submission uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 반려할 수 있습니다.'; end if;
  update public.product_submissions set status = 'rejected', review_note = left(p_note, 500), reviewed_at = now()
  where id = p_submission and status = 'pending';
  if not found then raise exception '검수 대기 중인 신청이 아닙니다.'; end if;
end; $$;

------------------------------------------------------------------------------
-- 4. 주문: 회원 연결, 판매방식·정산 몫 스냅샷, 배송 주체별 출고
------------------------------------------------------------------------------
alter table public.orders
  add column user_id uuid references auth.users(id) on delete set null,
  add column buyer_kind text not null default 'guest' check (buyer_kind in ('guest','member','business','vendor'));
create index orders_user_idx on public.orders (user_id);
create policy orders_owner_read on public.orders for select to authenticated using (user_id = auth.uid());

alter table public.order_items
  add column vendor_id uuid references public.vendors(id) on delete set null,
  add column channel text not null default 'retail' check (channel in ('retail','groupbuy','wholesale')),
  add column deal_type text not null default 'own',
  add column commission_rate numeric(5,2) not null default 0,
  add column supply_price integer not null default 0,
  add column fulfillment text not null default 'nini',
  add column vendor_share integer not null default 0,
  add column nini_share integer not null default 0;
update public.order_items set nini_share = unit_price * quantity;
create policy order_items_owner_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create table public.order_shipments (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  fulfiller_vendor_id uuid references public.vendors(id) on delete set null,
  fulfiller_key text not null, -- 'nini' 또는 도매처 uuid
  shipping_fee integer not null default 0,
  courier text,
  tracking_no text,
  shipped_at timestamptz,
  unique (order_id, fulfiller_key)
);
alter table public.order_shipments enable row level security;
create policy shipments_admin_all on public.order_shipments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy shipments_owner_read on public.order_shipments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- 기존 주문(있다면)을 니니랜드 출고 1건으로 옮긴다
insert into public.order_shipments (order_id, fulfiller_key, shipping_fee, courier, tracking_no, shipped_at)
select id, 'nini', shipping_fee, courier, tracking_no, shipped_at from public.orders
on conflict do nothing;

create table public.vendor_payouts (
  id bigserial primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount integer not null,
  memo text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.vendor_payouts enable row level security;
create policy payouts_read on public.vendor_payouts for select to authenticated using (public.is_admin() or vendor_id = public.my_vendor_id());
create policy payouts_admin_write on public.vendor_payouts for all to authenticated using (public.is_admin()) with check (public.is_admin());

------------------------------------------------------------------------------
-- 5. 주문 생성 (판매방식·정산 몫·출고 그룹을 서버에서 계산)
--    p_items: [{productId, color, size, quantity, channel: 'consumer'|'wholesale'}]
------------------------------------------------------------------------------
create or replace function public.place_order(
  p_items jsonb, p_recipient text, p_phone text, p_address text, p_memo text, p_depositor text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_prod record;
  v_ws record;
  v_cost integer;
  v_terms record;
  v_deal text;
  v_opt jsonb;
  v_size jsonb;
  v_qty integer;
  v_price integer;
  v_line integer;
  v_channel text;
  v_rate numeric;
  v_vendor_share integer;
  v_nini_share integer;
  v_fkey text;
  v_subtotal integer := 0;
  v_ship_total integer := 0;
  v_settings jsonb;
  v_threshold integer;
  v_fee integer;
  v_phone text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  v_order_id uuid;
  v_order_no text;
  v_lines jsonb := '[]'::jsonb;
  v_groups jsonb := '{}'::jsonb;
  v_img text;
  v_uid uuid := auth.uid();
  v_kind text := 'guest';
  g record;
begin
  if not coalesce(public.store_is_open(), false) and not public.is_admin() then
    raise exception '지금은 주문을 받지 않고 있습니다. 오픈 공지를 확인해주세요.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '장바구니가 비어 있습니다.';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception '한 번에 주문할 수 있는 옵션은 50개까지입니다.'; end if;
  if length(trim(coalesce(p_recipient,''))) = 0 or length(p_recipient) > 50 then raise exception '받는 분 이름을 확인해주세요.'; end if;
  if v_phone !~ '^01[0-9]{8,9}$' then raise exception '연락처를 010-1234-5678 형식으로 확인해주세요.'; end if;
  if length(trim(coalesce(p_address,''))) < 5 or length(p_address) > 300 then raise exception '배송지 주소를 확인해주세요.'; end if;
  if length(trim(coalesce(p_depositor,''))) = 0 or length(p_depositor) > 50 then raise exception '입금자명을 입력해주세요.'; end if;

  if v_uid is not null then
    v_kind := case when public.is_approved_business() then 'business'
                   when public.is_approved_vendor() then 'vendor'
                   else 'member' end;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 9999 then raise exception '수량을 확인해주세요.'; end if;

    select * into v_prod from public.products where id = v_item->>'productId' and active;
    if not found then raise exception '판매가 끝났거나 없는 상품이 있습니다. 장바구니에서 삭제 후 다시 주문해주세요.'; end if;
    select deal_type, commission_rate, wholesale_commission_rate, supply_price into v_terms from public.product_costs where product_id = v_prod.id;
    v_deal := case when v_prod.vendor_id is null then 'own' else coalesce(v_terms.deal_type, 'commission') end;
    v_cost := coalesce(v_terms.supply_price, 0);

    -- 옵션·품절 확인
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

    -- 판매방식별 가격
    if coalesce(v_item->>'channel','consumer') = 'wholesale' then
      if not public.can_buy_wholesale(v_prod.id) then raise exception '%: 도매 구매 권한이 없습니다. 사업자 승인 후 이용해주세요.', v_prod.data->>'name'; end if;
      select * into v_ws from public.product_wholesale where product_id = v_prod.id;
      if not found then raise exception '%: 도매가가 아직 정해지지 않았습니다.', v_prod.data->>'name'; end if;
      if v_qty < v_ws.min_qty then raise exception '%: 도매는 최소 %개부터 주문할 수 있습니다.', v_prod.data->>'name', v_ws.min_qty; end if;
      if v_qty % v_ws.order_unit <> 0 then raise exception '%: 도매는 %개 단위로 주문해주세요.', v_prod.data->>'name', v_ws.order_unit; end if;
      v_price := v_ws.price;
      v_channel := 'wholesale';
      v_rate := coalesce(v_terms.wholesale_commission_rate, v_terms.commission_rate, 0);
    else
      if v_prod.consumer_mode = 'none' then raise exception '%: 사업자 전용 상품입니다.', v_prod.data->>'name'; end if;
      if v_qty > 99 then raise exception '수량을 확인해주세요.'; end if;
      if v_prod.consumer_mode = 'groupbuy' and v_prod.groupbuy_ends_at is not null and v_prod.groupbuy_ends_at < now() then
        raise exception '%: 공구가 마감되었습니다.', v_prod.data->>'name';
      end if;
      v_price := coalesce(nullif((v_prod.data->>'discountPrice')::integer, 0), (v_prod.data->>'consumerPrice')::integer);
      v_channel := v_prod.consumer_mode;
      v_rate := coalesce(v_terms.commission_rate, 0);
    end if;
    if v_price is null or v_price <= 0 then raise exception '%: 가격 정보가 없습니다.', v_prod.data->>'name'; end if;

    -- 정산 몫
    v_line := v_price * v_qty;
    if v_deal = 'own' then
      v_vendor_share := 0;
    elsif v_deal = 'commission' then
      v_vendor_share := v_line - round(v_line * v_rate / 100.0)::int;
    else -- purchase(사입)
      v_vendor_share := least(v_cost * v_qty, v_line);
    end if;
    v_nini_share := v_line - v_vendor_share;

    v_fkey := case when v_prod.fulfillment = 'vendor' and v_prod.vendor_id is not null then v_prod.vendor_id::text else 'nini' end;
    v_groups := jsonb_set(v_groups, array[v_fkey], to_jsonb(coalesce((v_groups->>v_fkey)::int, 0) + v_line));

    v_subtotal := v_subtotal + v_line;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_prod.id, 'product_name', v_prod.data->>'name', 'color', v_item->>'color', 'size', v_item->>'size',
      'image', v_img, 'unit_price', v_price, 'quantity', v_qty, 'vendor_id', v_prod.vendor_id, 'channel', v_channel,
      'deal_type', v_deal,
      'commission_rate', case when v_deal = 'commission' then v_rate else 0 end,
      'supply_price', v_cost, 'fulfillment', case when v_fkey = 'nini' then 'nini' else 'vendor' end,
      'vendor_share', v_vendor_share, 'nini_share', v_nini_share);
  end loop;

  -- 배송비는 출고하는 곳(니니랜드 / 도매처 직접발송)마다 따로 계산
  select data into v_settings from public.store_settings where id = 1;
  v_threshold := coalesce((v_settings->>'freeShippingThreshold')::integer, 50000);
  v_fee := coalesce((v_settings->>'shippingFee')::integer, 3000);
  for g in select key, value::int as amount from jsonb_each_text(v_groups) loop
    v_ship_total := v_ship_total + case when v_threshold > 0 and g.amount >= v_threshold then 0 else v_fee end;
  end loop;

  loop
    v_order_no := to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.orders where order_no = v_order_no);
  end loop;

  insert into public.orders (order_no, recipient, phone, address, memo, depositor_name, subtotal, shipping_fee, total, user_id, buyer_kind)
  values (v_order_no, trim(p_recipient), v_phone, trim(p_address), nullif(trim(coalesce(p_memo,'')), ''), trim(p_depositor),
          v_subtotal, v_ship_total, v_subtotal + v_ship_total, v_uid, v_kind)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, color, size, image, unit_price, quantity,
    vendor_id, channel, deal_type, commission_rate, supply_price, fulfillment, vendor_share, nini_share)
  select v_order_id, l->>'product_id', l->>'product_name', l->>'color', l->>'size', l->>'image',
         (l->>'unit_price')::int, (l->>'quantity')::int, nullif(l->>'vendor_id','')::uuid, l->>'channel', l->>'deal_type',
         (l->>'commission_rate')::numeric, (l->>'supply_price')::int, l->>'fulfillment', (l->>'vendor_share')::int, (l->>'nini_share')::int
  from jsonb_array_elements(v_lines) l;

  insert into public.order_shipments (order_id, fulfiller_vendor_id, fulfiller_key, shipping_fee)
  select v_order_id, case when key = 'nini' then null else key::uuid end, key,
         case when v_threshold > 0 and value::int >= v_threshold then 0 else v_fee end
  from jsonb_each_text(v_groups);

  return jsonb_build_object('orderNo', v_order_no, 'subtotal', v_subtotal, 'shippingFee', v_ship_total, 'total', v_subtotal + v_ship_total);
end; $$;
revoke all on function public.place_order(jsonb,text,text,text,text,text) from public;
grant execute on function public.place_order(jsonb,text,text,text,text,text) to anon, authenticated;

-- 손님 주문 조회: 출고(택배) 목록 포함
create or replace function public.get_order(p_order_no text, p_phone text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'orderNo', o.order_no, 'status', o.status, 'recipient', o.recipient, 'phone', o.phone,
    'address', o.address, 'memo', o.memo, 'depositorName', o.depositor_name,
    'subtotal', o.subtotal, 'shippingFee', o.shipping_fee, 'total', o.total,
    'cancelRequestedAt', o.cancel_requested_at, 'createdAt', o.created_at,
    'paidAt', o.paid_at, 'shippedAt', o.shipped_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'productId', i.product_id, 'name', i.product_name, 'color', i.color, 'size', i.size, 'channel', i.channel,
        'image', i.image, 'unitPrice', i.unit_price, 'quantity', i.quantity) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'shipments', coalesce((select jsonb_agg(jsonb_build_object(
        'from', coalesce(v.company_name, '니니랜드'), 'courier', sh.courier, 'trackingNo', sh.tracking_no, 'shippedAt', sh.shipped_at) order by sh.id)
      from public.order_shipments sh left join public.vendors v on v.id = sh.fulfiller_vendor_id where sh.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.order_no = trim(p_order_no)
    and (o.phone = regexp_replace(coalesce(p_phone,''), '\D', '', 'g') or (auth.uid() is not null and o.user_id = auth.uid()));
$$;

-- 회원 내 주문 목록
create or replace function public.my_orders() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('orderNo', order_no, 'phone', phone, 'status', status, 'total', total, 'createdAt', created_at,
    'summary', (select string_agg(i.product_name, ', ') from public.order_items i where i.order_id = o.id)) order by created_at desc), '[]'::jsonb)
  from public.orders o where o.user_id = auth.uid();
$$;

-- 내 계정 상태 한 번에
create or replace function public.my_account() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'isAdmin', public.is_admin(),
    'profile', (select to_jsonb(p) - 'user_id' from public.profiles p where p.user_id = auth.uid()),
    'business', (select jsonb_build_object('status', status, 'companyName', company_name, 'businessNumber', business_number,
                   'reviewNote', review_note, 'hasCert', cert_path is not null) from public.business_accounts where user_id = auth.uid()),
    'vendor', (select jsonb_build_object('id', id, 'status', status, 'companyName', company_name, 'businessNumber', business_number,
                   'reviewNote', review_note, 'hasCert', cert_path is not null) from public.vendors where user_id = auth.uid()));
$$;

-- 공구 진행 수량 (도매 주문 제외)
create or replace function public.groupbuy_counts() returns table (product_id text, quantity bigint)
language sql stable security definer set search_path = public as $$
  select i.product_id, sum(i.quantity) from public.order_items i
  join public.orders o on o.id = i.order_id
  where o.status <> 'cancelled' and i.channel <> 'wholesale'
  group by i.product_id;
$$;

------------------------------------------------------------------------------
-- 6. 도매처 화면용: 내 직접발송 주문, 송장 입력, 정산
------------------------------------------------------------------------------
create or replace function public.vendor_orders() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select id from public.vendors where user_id = auth.uid() and status = 'approved')
  select coalesce(jsonb_agg(x order by x->>'createdAt' desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'orderId', o.id, 'orderNo', o.order_no, 'status', o.status, 'createdAt', o.created_at, 'paidAt', o.paid_at,
      'shipsByMe', sh.id is not null,
      -- 받는 분 정보는 내가 직접 보내는 주문이고 입금 확인된 경우에만
      'recipient', case when sh.id is not null and o.status in ('paid','preparing','shipped','delivered') then o.recipient end,
      'phone', case when sh.id is not null and o.status in ('paid','preparing','shipped','delivered') then o.phone end,
      'address', case when sh.id is not null and o.status in ('paid','preparing','shipped','delivered') then o.address end,
      'memo', case when sh.id is not null and o.status in ('paid','preparing','shipped','delivered') then o.memo end,
      'courier', sh.courier, 'trackingNo', sh.tracking_no, 'shippedAt', sh.shipped_at, 'shippingFee', sh.shipping_fee,
      'items', (select jsonb_agg(jsonb_build_object('name', i.product_name, 'color', i.color, 'size', i.size, 'quantity', i.quantity,
                 'unitPrice', i.unit_price, 'channel', i.channel, 'vendorShare', i.vendor_share, 'fulfillment', i.fulfillment) order by i.id)
               from public.order_items i where i.order_id = o.id and i.vendor_id = (select id from me))) as x
    from public.orders o
    left join public.order_shipments sh on sh.order_id = o.id and sh.fulfiller_vendor_id = (select id from me)
    where o.status <> 'cancelled' and exists (select 1 from public.order_items i where i.order_id = o.id and i.vendor_id = (select id from me))
  ) t;
$$;

create or replace function public.vendor_set_tracking(p_order uuid, p_courier text, p_tracking text) returns void
language plpgsql security definer set search_path = public as $$
declare v_vendor uuid;
begin
  select id into v_vendor from public.vendors where user_id = auth.uid() and status = 'approved';
  if v_vendor is null then raise exception '승인된 도매처만 송장을 입력할 수 있습니다.'; end if;
  if not exists (select 1 from public.orders where id = p_order and status in ('paid','preparing','shipped')) then
    raise exception '입금 확인된 주문만 발송할 수 있습니다.';
  end if;
  update public.order_shipments set courier = left(p_courier, 30), tracking_no = left(trim(p_tracking), 40), shipped_at = coalesce(shipped_at, now())
  where order_id = p_order and fulfiller_vendor_id = v_vendor;
  if not found then raise exception '내가 발송하는 주문이 아닙니다.'; end if;
  perform public.sync_order_shipping(p_order);
end; $$;

-- 모든 출고에 송장이 들어가면 주문을 '배송중'으로
create or replace function public.sync_order_shipping(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.order_shipments where order_id = p_order and (tracking_no is null or tracking_no = '')) then
    update public.orders set status = 'shipped', shipped_at = coalesce(shipped_at, now())
    where id = p_order and status in ('paid','preparing');
  end if;
end; $$;

-- 정산: 입금 확인 이후(취소 제외) 주문 기준. 배송비는 출고한 곳 몫.
create or replace function public.settlement_summary(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_mine uuid := public.my_vendor_id();
begin
  if not public.is_admin() and v_mine is null then raise exception '권한이 없습니다.'; end if;
  return (
    with lines as (
      select i.vendor_id, i.channel, i.deal_type, i.unit_price * i.quantity as sales, i.vendor_share, i.nini_share
      from public.order_items i join public.orders o on o.id = i.order_id
      where o.status in ('paid','preparing','shipped','delivered')
        and (o.paid_at at time zone 'Asia/Seoul')::date between p_from and p_to
        and (public.is_admin() or i.vendor_id = v_mine)
    ), ship as (
      select sh.fulfiller_vendor_id as vendor_id, sum(sh.shipping_fee) as fee
      from public.order_shipments sh join public.orders o on o.id = sh.order_id
      where o.status in ('paid','preparing','shipped','delivered')
        and (o.paid_at at time zone 'Asia/Seoul')::date between p_from and p_to
        and (public.is_admin() or sh.fulfiller_vendor_id = v_mine)
      group by sh.fulfiller_vendor_id
    ), per_vendor as (
      select l.vendor_id, sum(l.sales) sales, sum(l.vendor_share) vendor_share, sum(l.nini_share) nini_share,
             sum(case when l.channel = 'wholesale' then l.sales else 0 end) wholesale_sales,
             sum(case when l.channel = 'groupbuy' then l.sales else 0 end) groupbuy_sales,
             sum(case when l.channel = 'retail' then l.sales else 0 end) retail_sales
      from lines l group by l.vendor_id
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'vendorId', pv.vendor_id,
      'vendorName', coalesce(v.company_name, '니니랜드 자체'),
      'bank', case when v.id is not null then concat_ws(' ', v.bank_name, v.bank_account, v.bank_holder) end,
      'sales', pv.sales, 'retailSales', pv.retail_sales, 'groupbuySales', pv.groupbuy_sales, 'wholesaleSales', pv.wholesale_sales,
      'vendorShare', pv.vendor_share, 'niniShare', pv.nini_share,
      'shippingFee', coalesce(s.fee, 0),
      'payable', case when pv.vendor_id is null then 0 else pv.vendor_share + coalesce(s.fee, 0) end,
      'paid', coalesce((select sum(amount) from public.vendor_payouts p where p.vendor_id = pv.vendor_id
                        and p.period_start >= p_from and p.period_end <= p_to), 0)
    ) order by pv.vendor_id nulls first), '[]'::jsonb)
    from per_vendor pv left join public.vendors v on v.id = pv.vendor_id
    left join ship s on s.vendor_id is not distinct from pv.vendor_id
  );
end; $$;

------------------------------------------------------------------------------
-- 권한
------------------------------------------------------------------------------
revoke all on function public.my_vendor_id() from public;
revoke all on function public.is_approved_vendor() from public;
revoke all on function public.is_approved_business() from public;
revoke all on function public.can_buy_wholesale(text) from public;
revoke all on function public.vendor_public_info(uuid) from public;
revoke all on function public.approve_submission(uuid, jsonb) from public;
revoke all on function public.reject_submission(uuid, text) from public;
revoke all on function public.get_order(text,text) from public;
revoke all on function public.my_orders() from public;
revoke all on function public.my_account() from public;
revoke all on function public.groupbuy_counts() from public;
revoke all on function public.vendor_orders() from public;
revoke all on function public.vendor_set_tracking(uuid,text,text) from public;
revoke all on function public.sync_order_shipping(uuid) from public;
revoke all on function public.settlement_summary(date,date) from public;
revoke all on function public.set_my_cert(text) from public;
revoke all on function public.handle_new_user() from public;

grant execute on function public.my_vendor_id() to authenticated;
grant execute on function public.is_approved_vendor() to anon, authenticated;
grant execute on function public.is_approved_business() to anon, authenticated;
grant execute on function public.can_buy_wholesale(text) to anon, authenticated;
grant execute on function public.vendor_public_info(uuid) to anon, authenticated;
grant execute on function public.approve_submission(uuid, jsonb) to authenticated;
grant execute on function public.reject_submission(uuid, text) to authenticated;
grant execute on function public.get_order(text,text) to anon, authenticated;
grant execute on function public.my_orders() to authenticated;
grant execute on function public.my_account() to authenticated;
grant execute on function public.groupbuy_counts() to anon, authenticated;
grant execute on function public.vendor_orders() to authenticated;
grant execute on function public.vendor_set_tracking(uuid,text,text) to authenticated;
grant execute on function public.settlement_summary(date,date) to authenticated;
grant execute on function public.set_my_cert(text) to authenticated;

-- 승인된 도매처는 자기 폴더(vendors/<도매처id>/...)에만 상품 사진을 올릴 수 있다
create policy product_images_vendor_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_approved_vendor()
    and (storage.foldername(name))[1] = 'vendors' and (storage.foldername(name))[2] = public.my_vendor_id()::text);
