-- 2026-11-16 지인 등급 + 지인가 + 결제수단(카드/계좌이체)별 할인율
-- 회원 등급: 소매(일반) / 지인(관리자가 등업) / 사업자(도매)
-- 상품마다: 지인가 켜기·금액, 등급 × 결제수단 할인율(%)

------------------------------------------------------------------------------
-- 1. 지인 회원 (관리자만 등업·해제. profiles는 본인이 고칠 수 있으므로 따로 둔다)
------------------------------------------------------------------------------
create table public.friend_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memo text,
  created_at timestamptz not null default now()
);
alter table public.friend_members enable row level security;
create policy friend_members_admin_all on public.friend_members for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy friend_members_self_read on public.friend_members for select to authenticated using (user_id = auth.uid());

create or replace function public.is_friend() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friend_members where user_id = auth.uid());
$$;

------------------------------------------------------------------------------
-- 2. 상품별 지인가 (지인·관리자만 읽음) + 지인 결제 할인율
------------------------------------------------------------------------------
create table public.product_friend (
  product_id text primary key references public.products(id) on delete cascade,
  price integer not null check (price > 0),
  card_rate numeric(5,2) not null default 0 check (card_rate between 0 and 100),
  bank_rate numeric(5,2) not null default 0 check (bank_rate between 0 and 100)
);
alter table public.product_friend enable row level security;
create policy product_friend_read on public.product_friend for select to authenticated using (public.is_friend() or public.is_admin());
create policy product_friend_admin_write on public.product_friend for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 소매·사업자 결제 할인율: {"retail":{"card":0,"bank":5},"wholesale":{"card":0,"bank":0}}
alter table public.products add column pay_discounts jsonb not null default '{}'::jsonb;

------------------------------------------------------------------------------
-- 3. 주문: 결제수단, 할인 전 가격·할인율
------------------------------------------------------------------------------
alter table public.orders
  add column payment_method text not null default 'bank' check (payment_method in ('bank','card')),
  add column discount_total integer not null default 0;
alter table public.orders drop constraint if exists orders_buyer_kind_check;
alter table public.orders add constraint orders_buyer_kind_check check (buyer_kind in ('guest','member','friend','business','vendor'));

alter table public.order_items
  add column list_price integer,
  add column discount_rate numeric(5,2) not null default 0;
alter table public.order_items drop constraint if exists order_items_channel_check;
alter table public.order_items add constraint order_items_channel_check check (channel in ('retail','groupbuy','friend','wholesale'));

------------------------------------------------------------------------------
-- 4. 결제 할인율 계산 (등급 × 결제수단)
------------------------------------------------------------------------------
create or replace function public.pay_rate(p_discounts jsonb, p_tier text, p_method text) returns numeric
language sql immutable set search_path = public as $$
  select least(greatest(coalesce(nullif(p_discounts->p_tier->>p_method, '')::numeric, 0), 0), 100);
$$;

------------------------------------------------------------------------------
-- 5. 주문 생성: channel 'consumer' | 'friend' | 'wholesale', 결제수단 p_payment
------------------------------------------------------------------------------
drop function if exists public.place_order(jsonb, text, text, text, text, text);

create or replace function public.place_order(
  p_items jsonb, p_recipient text, p_phone text, p_address text, p_memo text, p_depositor text, p_payment text default 'bank'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_prod record;
  v_ws record;
  v_fr record;
  v_cost integer;
  v_terms record;
  v_deal text;
  v_opt jsonb;
  v_size jsonb;
  v_qty integer;
  v_list integer;
  v_pay_rate numeric;
  v_price integer;
  v_line integer;
  v_channel text;
  v_rate numeric;
  v_vendor_share integer;
  v_nini_share integer;
  v_fkey text;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_ship_total integer := 0;
  v_settings jsonb;
  v_threshold integer;
  v_fee integer;
  v_phone text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  v_method text := coalesce(nullif(p_payment, ''), 'bank');
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
  if v_method not in ('bank','card') then raise exception '결제 방법을 다시 선택해주세요.'; end if;
  select data into v_settings from public.store_settings where id = 1;
  if v_method = 'card' and not coalesce((v_settings->>'cardPaymentEnabled')::boolean, false) then
    raise exception '카드 결제는 준비 중입니다. 계좌이체로 주문해주세요.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '장바구니가 비어 있습니다.';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception '한 번에 주문할 수 있는 옵션은 50개까지입니다.'; end if;
  if length(trim(coalesce(p_recipient,''))) = 0 or length(p_recipient) > 50 then raise exception '받는 분 이름을 확인해주세요.'; end if;
  if v_phone !~ '^01[0-9]{8,9}$' then raise exception '연락처를 010-1234-5678 형식으로 확인해주세요.'; end if;
  if length(trim(coalesce(p_address,''))) < 5 or length(p_address) > 300 then raise exception '배송지 주소를 확인해주세요.'; end if;
  if v_method = 'bank' and (length(trim(coalesce(p_depositor,''))) = 0 or length(p_depositor) > 50) then raise exception '입금자명을 입력해주세요.'; end if;

  if v_uid is not null then
    v_kind := case when public.is_approved_business() then 'business'
                   when public.is_approved_vendor() then 'vendor'
                   when public.is_friend() then 'friend'
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

    -- 판매방식별 기본 가격 + 결제수단 할인율
    if coalesce(v_item->>'channel','consumer') = 'wholesale' then
      if not public.can_buy_wholesale(v_prod.id) then raise exception '%: 도매 구매 권한이 없습니다. 사업자 승인 후 이용해주세요.', v_prod.data->>'name'; end if;
      select * into v_ws from public.product_wholesale where product_id = v_prod.id;
      if not found then raise exception '%: 도매가가 아직 정해지지 않았습니다.', v_prod.data->>'name'; end if;
      if v_qty < v_ws.min_qty then raise exception '%: 도매는 최소 %개부터 주문할 수 있습니다.', v_prod.data->>'name', v_ws.min_qty; end if;
      if v_qty % v_ws.order_unit <> 0 then raise exception '%: 도매는 %개 단위로 주문해주세요.', v_prod.data->>'name', v_ws.order_unit; end if;
      v_list := v_ws.price;
      v_pay_rate := public.pay_rate(v_prod.pay_discounts, 'wholesale', v_method);
      v_channel := 'wholesale';
      v_rate := coalesce(v_terms.wholesale_commission_rate, v_terms.commission_rate, 0);
    elsif v_item->>'channel' = 'friend' then
      if not (public.is_friend() or public.is_admin()) then raise exception '%: 지인가는 지인 회원만 구매할 수 있습니다.', v_prod.data->>'name'; end if;
      select * into v_fr from public.product_friend where product_id = v_prod.id;
      if not found then raise exception '%: 지인가로 판매하지 않는 상품입니다.', v_prod.data->>'name'; end if;
      if v_qty > 99 then raise exception '수량을 확인해주세요.'; end if;
      if v_prod.consumer_mode = 'groupbuy' and v_prod.groupbuy_ends_at is not null and v_prod.groupbuy_ends_at < now() then
        raise exception '%: 예약 판매가 마감되었습니다.', v_prod.data->>'name';
      end if;
      v_list := v_fr.price;
      v_pay_rate := least(greatest(case when v_method = 'card' then v_fr.card_rate else v_fr.bank_rate end, 0), 100);
      v_channel := 'friend';
      v_rate := coalesce(v_terms.commission_rate, 0);
    else
      if v_prod.consumer_mode = 'none' then raise exception '%: 일반 판매를 하지 않는 상품입니다.', v_prod.data->>'name'; end if;
      if v_qty > 99 then raise exception '수량을 확인해주세요.'; end if;
      if v_prod.consumer_mode = 'groupbuy' and v_prod.groupbuy_ends_at is not null and v_prod.groupbuy_ends_at < now() then
        raise exception '%: 예약 판매가 마감되었습니다.', v_prod.data->>'name';
      end if;
      v_list := coalesce(nullif((v_prod.data->>'discountPrice')::integer, 0), (v_prod.data->>'consumerPrice')::integer);
      v_pay_rate := public.pay_rate(v_prod.pay_discounts, 'retail', v_method);
      v_channel := v_prod.consumer_mode;
      v_rate := coalesce(v_terms.commission_rate, 0);
    end if;
    if v_list is null or v_list <= 0 then raise exception '%: 가격 정보가 없습니다.', v_prod.data->>'name'; end if;

    -- 1개 가격에 할인율 적용 (원 단위 반올림)
    v_price := round(v_list * (100 - v_pay_rate) / 100.0)::int;
    v_line := v_price * v_qty;
    v_discount := v_discount + (v_list - v_price) * v_qty;

    if v_deal = 'own' then
      v_vendor_share := 0;
    elsif v_deal = 'commission' then
      v_vendor_share := v_line - round(v_line * v_rate / 100.0)::int;
    else
      v_vendor_share := least(v_cost * v_qty, v_line);
    end if;
    v_nini_share := v_line - v_vendor_share;

    v_fkey := case when v_prod.fulfillment = 'vendor' and v_prod.vendor_id is not null then v_prod.vendor_id::text else 'nini' end;
    v_groups := jsonb_set(v_groups, array[v_fkey], to_jsonb(coalesce((v_groups->>v_fkey)::int, 0) + v_line));

    v_subtotal := v_subtotal + v_line;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_prod.id, 'product_name', v_prod.data->>'name', 'color', v_item->>'color', 'size', v_item->>'size',
      'image', v_img, 'unit_price', v_price, 'list_price', v_list, 'discount_rate', v_pay_rate, 'quantity', v_qty,
      'vendor_id', v_prod.vendor_id, 'channel', v_channel, 'deal_type', v_deal,
      'commission_rate', case when v_deal = 'commission' then v_rate else 0 end,
      'supply_price', v_cost, 'fulfillment', case when v_fkey = 'nini' then 'nini' else 'vendor' end,
      'vendor_share', v_vendor_share, 'nini_share', v_nini_share);
  end loop;

  -- 배송비는 할인 후 금액 기준, 출고하는 곳마다
  v_threshold := coalesce((v_settings->>'freeShippingThreshold')::integer, 50000);
  v_fee := coalesce((v_settings->>'shippingFee')::integer, 3000);
  for g in select key, value::int as amount from jsonb_each_text(v_groups) loop
    v_ship_total := v_ship_total + case when v_threshold > 0 and g.amount >= v_threshold then 0 else v_fee end;
  end loop;

  loop
    v_order_no := to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.orders where order_no = v_order_no);
  end loop;

  insert into public.orders (order_no, recipient, phone, address, memo, depositor_name, subtotal, shipping_fee, total, user_id, buyer_kind, payment_method, discount_total)
  values (v_order_no, trim(p_recipient), v_phone, trim(p_address), nullif(trim(coalesce(p_memo,'')), ''),
          coalesce(nullif(trim(coalesce(p_depositor,'')), ''), trim(p_recipient)),
          v_subtotal, v_ship_total, v_subtotal + v_ship_total, v_uid, v_kind, v_method, v_discount)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, color, size, image, unit_price, list_price, discount_rate, quantity,
    vendor_id, channel, deal_type, commission_rate, supply_price, fulfillment, vendor_share, nini_share)
  select v_order_id, l->>'product_id', l->>'product_name', l->>'color', l->>'size', l->>'image',
         (l->>'unit_price')::int, (l->>'list_price')::int, (l->>'discount_rate')::numeric, (l->>'quantity')::int,
         nullif(l->>'vendor_id','')::uuid, l->>'channel', l->>'deal_type',
         (l->>'commission_rate')::numeric, (l->>'supply_price')::int, l->>'fulfillment', (l->>'vendor_share')::int, (l->>'nini_share')::int
  from jsonb_array_elements(v_lines) l;

  insert into public.order_shipments (order_id, fulfiller_vendor_id, fulfiller_key, shipping_fee)
  select v_order_id, case when key = 'nini' then null else key::uuid end, key,
         case when v_threshold > 0 and value::int >= v_threshold then 0 else v_fee end
  from jsonb_each_text(v_groups);

  return jsonb_build_object('orderNo', v_order_no, 'subtotal', v_subtotal, 'discount', v_discount, 'shippingFee', v_ship_total,
    'total', v_subtotal + v_ship_total, 'paymentMethod', v_method);
end; $$;
revoke all on function public.place_order(jsonb,text,text,text,text,text,text) from public;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text) to anon, authenticated;

------------------------------------------------------------------------------
-- 6. 계정 정보에 지인 여부, 주문 조회에 결제수단·할인
------------------------------------------------------------------------------
create or replace function public.my_account() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'isAdmin', public.is_admin(),
    'isFriend', public.is_friend(),
    'profile', (select to_jsonb(p) - 'user_id' from public.profiles p where p.user_id = auth.uid()),
    'business', (select jsonb_build_object('status', status, 'companyName', company_name, 'businessNumber', business_number,
                   'reviewNote', review_note, 'hasCert', cert_path is not null) from public.business_accounts where user_id = auth.uid()),
    'vendor', (select jsonb_build_object('id', id, 'status', status, 'companyName', company_name, 'businessNumber', business_number,
                   'reviewNote', review_note, 'hasCert', cert_path is not null) from public.vendors where user_id = auth.uid()));
$$;

create or replace function public.get_order(p_order_no text, p_phone text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'orderNo', o.order_no, 'status', o.status, 'recipient', o.recipient, 'phone', o.phone,
    'address', o.address, 'memo', o.memo, 'depositorName', o.depositor_name,
    'subtotal', o.subtotal, 'shippingFee', o.shipping_fee, 'total', o.total,
    'paymentMethod', o.payment_method, 'discountTotal', o.discount_total,
    'cancelRequestedAt', o.cancel_requested_at, 'createdAt', o.created_at,
    'paidAt', o.paid_at, 'shippedAt', o.shipped_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'productId', i.product_id, 'name', i.product_name, 'color', i.color, 'size', i.size, 'channel', i.channel,
        'image', i.image, 'unitPrice', i.unit_price, 'listPrice', coalesce(i.list_price, i.unit_price), 'discountRate', i.discount_rate,
        'quantity', i.quantity) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'shipments', coalesce((select jsonb_agg(jsonb_build_object(
        'from', coalesce(v.company_name, '니니랜드'), 'courier', sh.courier, 'trackingNo', sh.tracking_no, 'shippedAt', sh.shipped_at) order by sh.id)
      from public.order_shipments sh left join public.vendors v on v.id = sh.fulfiller_vendor_id where sh.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.order_no = trim(p_order_no)
    and (o.phone = regexp_replace(coalesce(p_phone,''), '\D', '', 'g') or (auth.uid() is not null and o.user_id = auth.uid()));
$$;

-- 일반 판매량 집계에서 지인 주문은 포함(도매만 제외) — 기존 그대로

------------------------------------------------------------------------------
-- 7. 관리자: 회원 목록·지인 등업
------------------------------------------------------------------------------
create or replace function public.admin_members() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있습니다.'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'userId', u.id, 'email', u.email, 'provider', coalesce(u.raw_app_meta_data->>'provider', 'email'),
      'name', p.name, 'phone', p.phone, 'joinedAt', u.created_at,
      'isFriend', f.user_id is not null, 'friendMemo', f.memo,
      'isAdmin', exists (select 1 from public.admins a where a.user_id = u.id),
      'business', b.status, 'vendor', vd.status) order by u.created_at desc), '[]'::jsonb)
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.friend_members f on f.user_id = u.id
    left join public.business_accounts b on b.user_id = u.id
    left join public.vendors vd on vd.user_id = u.id
  );
end; $$;

create or replace function public.admin_set_friend(p_user uuid, p_on boolean, p_memo text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 등급을 바꿀 수 있습니다.'; end if;
  if p_on then
    insert into public.friend_members (user_id, memo) values (p_user, nullif(left(trim(coalesce(p_memo,'')), 100), ''))
    on conflict (user_id) do update set memo = excluded.memo;
  else
    delete from public.friend_members where user_id = p_user;
  end if;
end; $$;

revoke all on function public.is_friend() from public;
revoke all on function public.pay_rate(jsonb, text, text) from public;
revoke all on function public.admin_members() from public;
revoke all on function public.admin_set_friend(uuid, boolean, text) from public;
revoke execute on function public.admin_members() from anon;
revoke execute on function public.admin_set_friend(uuid, boolean, text) from anon;
grant execute on function public.is_friend() to anon, authenticated;
grant execute on function public.admin_members() to authenticated;
grant execute on function public.admin_set_friend(uuid, boolean, text) to authenticated;

------------------------------------------------------------------------------
-- 8. 홈 문구: 유아봇 먼저 (변신로봇인형은 나중에)
------------------------------------------------------------------------------
update public.store_settings
set data = data || jsonb_build_object(
  'heroTitle', '니니랜드가 직접 만든 유아봇',
  'heroDescription', '우리 아이 첫 로봇 친구, 니니랜드 유아봇을 만나보세요.',
  'heroBadge', 'NEW',
  'cardPaymentEnabled', coalesce((data->>'cardPaymentEnabled')::boolean, false))
where id = 1;
