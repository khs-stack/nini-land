-- 니니랜드 공구몰 초기 스키마 (Supabase 프로젝트 nini-land, ap-northeast-2)
-- 손님은 회원가입 없이 RPC(place_order/get_order/cancel_order)로만 주문에 접근하고,
-- 주문 테이블 자체는 관리자(admins)만 읽고 쓸 수 있다.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy admins_self_read on public.admins for select to authenticated using (user_id = auth.uid());

create table public.products (
  id text primary key,
  slug text not null unique,
  data jsonb not null,
  active boolean not null default true,
  groupbuy_ends_at timestamptz,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy products_public_read on public.products for select using (active or public.is_admin());
create policy products_admin_insert on public.products for insert to authenticated with check (public.is_admin());
create policy products_admin_update on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_delete on public.products for delete to authenticated using (public.is_admin());

create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;
create policy settings_public_read on public.store_settings for select using (true);
create policy settings_admin_insert on public.store_settings for insert to authenticated with check (public.is_admin());
create policy settings_admin_update on public.store_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  status text not null default 'awaiting_deposit'
    check (status in ('awaiting_deposit','paid','preparing','shipped','delivered','cancelled')),
  recipient text not null,
  phone text not null,
  address text not null,
  memo text,
  depositor_name text not null,
  subtotal integer not null,
  shipping_fee integer not null,
  total integer not null,
  courier text,
  tracking_no text,
  admin_memo text,
  cancel_requested_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_phone_idx on public.orders (phone);
alter table public.orders enable row level security;
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  color text,
  size text,
  image text,
  unit_price integer not null,
  quantity integer not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
alter table public.order_items enable row level security;
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();

-- place_order 최종본은 20261026091000_store_open_gate.sql 참고

create or replace function public.get_order(p_order_no text, p_phone text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'orderNo', o.order_no, 'status', o.status, 'recipient', o.recipient, 'phone', o.phone,
    'address', o.address, 'memo', o.memo, 'depositorName', o.depositor_name,
    'subtotal', o.subtotal, 'shippingFee', o.shipping_fee, 'total', o.total,
    'courier', o.courier, 'trackingNo', o.tracking_no,
    'cancelRequestedAt', o.cancel_requested_at, 'createdAt', o.created_at,
    'paidAt', o.paid_at, 'shippedAt', o.shipped_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'productId', i.product_id, 'name', i.product_name, 'color', i.color, 'size', i.size,
        'image', i.image, 'unitPrice', i.unit_price, 'quantity', i.quantity) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where o.order_no = trim(p_order_no)
    and o.phone = regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
$$;

create or replace function public.cancel_order(p_order_no text, p_phone text, p_reason text) returns text
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders
  where order_no = trim(p_order_no) and phone = regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  if not found then raise exception '주문을 찾을 수 없습니다.'; end if;
  if v_order.status = 'awaiting_deposit' then
    update public.orders set status = 'cancelled', cancelled_at = now(), cancel_reason = left(p_reason, 500) where id = v_order.id;
    return 'cancelled';
  elsif v_order.status in ('paid','preparing') then
    update public.orders set cancel_requested_at = now(), cancel_reason = left(p_reason, 500) where id = v_order.id;
    return 'requested';
  else
    raise exception '이미 발송된 주문은 고객센터로 문의해주세요.';
  end if;
end; $$;

create or replace function public.groupbuy_counts() returns table (product_id text, quantity bigint)
language sql stable security definer set search_path = public as $$
  select i.product_id, sum(i.quantity) from public.order_items i
  join public.orders o on o.id = i.order_id
  where o.status <> 'cancelled'
  group by i.product_id;
$$;

revoke all on function public.get_order(text,text) from public;
revoke all on function public.cancel_order(text,text,text) from public;
revoke all on function public.groupbuy_counts() from public;
grant execute on function public.get_order(text,text) to anon, authenticated;
grant execute on function public.cancel_order(text,text,text) to anon, authenticated;
grant execute on function public.groupbuy_counts() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;
create policy product_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
