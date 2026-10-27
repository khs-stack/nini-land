-- 니니랜드 2단계: 회원(카카오)·사업자 구매자·입점 도매처·상품 검수·거래방식·자동 정산
--
-- 역할
--   손님(guest)      : 로그인 없이 주문 (기존)
--   회원(member)     : 카카오 간편가입. 내 주문이 계정에 쌓임
--   사업자(business) : 이메일 가입 필수 + 등록증 → 대표 승인 후 도매가 열람·도매 주문
--   도매처(vendor)   : 이메일 가입 필수 + 등록증·정산계좌 → 대표 승인 후 상품 등록 신청
--   관리자(admin)    : 니니랜드 대표. 검수·개시·정산

------------------------------------------------------------------------------
-- 1. 계정
------------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  marketing_agree boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_self_read on public.profiles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.business_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  business_number text not null,
  representative text,
  phone text,
  address text,
  cert_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.business_accounts enable row level security;
create policy business_self_read on public.business_accounts for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy business_admin_update on public.business_accounts for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  business_number text not null,
  representative text,
  phone text,
  email text,
  address text,
  mail_order_number text,
  bank_name text,
  bank_account text,
  bank_holder text,
  cert_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  review_note text,
  default_deal_type text not null default 'commission' check (default_deal_type in ('commission','purchase')),
  default_commission_rate numeric(5,2) not null default 0 check (default_commission_rate between 0 and 100),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.vendors enable row level security;
create policy vendors_self_read on public.vendors for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy vendors_admin_insert on public.vendors for insert to authenticated with check (public.is_admin());
create policy vendors_admin_update on public.vendors for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 로그인한 사람의 도매처 id (승인 여부 무관)
create or replace function public.my_vendor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.vendors where user_id = auth.uid();
$$;

create or replace function public.is_approved_vendor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendors where user_id = auth.uid() and status = 'approved');
$$;

create or replace function public.is_approved_business() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.business_accounts where user_id = auth.uid() and status = 'approved');
$$;

-- 가입 시 메타데이터(signup_kind)에 따라 신청서 행을 만든다. 이메일 인증 여부와 무관하게 남는다.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (user_id, name, phone, marketing_agree)
  values (new.id,
          coalesce(nullif(m->>'name',''), nullif(m->>'full_name',''), nullif(m->>'nickname',''), nullif(m->>'preferred_username','')),
          nullif(m->>'phone',''),
          coalesce((m->>'marketing_agree')::boolean, false))
  on conflict (user_id) do nothing;

  if m->>'signup_kind' = 'business' then
    insert into public.business_accounts (user_id, company_name, business_number, representative, phone, address)
    values (new.id, coalesce(nullif(m->>'company_name',''), '(상호 미입력)'), coalesce(m->>'business_number',''),
            m->>'representative', m->>'phone', m->>'address')
    on conflict (user_id) do nothing;
  elsif m->>'signup_kind' = 'vendor' then
    insert into public.vendors (user_id, company_name, business_number, representative, phone, email, address,
                                mail_order_number, bank_name, bank_account, bank_holder)
    values (new.id, coalesce(nullif(m->>'company_name',''), '(상호 미입력)'), coalesce(m->>'business_number',''),
            m->>'representative', m->>'phone', new.email, m->>'address', m->>'mail_order_number',
            m->>'bank_name', m->>'bank_account', m->>'bank_holder')
    on conflict (user_id) do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- 기존 관리자 계정 프로필
insert into public.profiles (user_id, name) select user_id, '관리자' from public.admins on conflict do nothing;

-- 사업자등록증 (비공개). 본인 폴더(user_id/...)에만 올리고, 본인·관리자만 열람
insert into storage.buckets (id, name, public) values ('business-docs', 'business-docs', false) on conflict (id) do nothing;
create policy business_docs_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'business-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy business_docs_own_read on storage.objects for select to authenticated
  using (bucket_id = 'business-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy business_docs_own_update on storage.objects for update to authenticated
  using (bucket_id = 'business-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 등록증 경로 저장 (본인 신청서에만)
create or replace function public.set_my_cert(p_path text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_path is null or split_part(p_path, '/', 1) <> auth.uid()::text then raise exception '잘못된 파일 경로입니다.'; end if;
  update public.business_accounts set cert_path = p_path where user_id = auth.uid();
  update public.vendors set cert_path = p_path where user_id = auth.uid();
end; $$;

------------------------------------------------------------------------------
-- 2. 상품: 판매방식·거래방식·배송 주체 + 비공개 가격
------------------------------------------------------------------------------
alter table public.products
  add column vendor_id uuid references public.vendors(id) on delete set null,
  add column consumer_mode text not null default 'retail' check (consumer_mode in ('retail','groupbuy','none')),
  add column wholesale_enabled boolean not null default false,
  add column wholesale_audience text not null default 'business' check (wholesale_audience in ('business','vendors','both')),
  add column deal_type text not null default 'own' check (deal_type in ('own','commission','purchase')),
  add column commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  add column wholesale_commission_rate numeric(5,2) check (wholesale_commission_rate between 0 and 100),
  add column fulfillment text not null default 'nini' check (fulfillment in ('nini','vendor'));

update public.products set consumer_mode = case when data->>'category' = '공구상품' or groupbuy_ends_at is not null then 'groupbuy' else 'retail' end;
-- 예전 목업 원가·도매 조건은 공개 data에서 제거 (값은 샘플이었음)
update public.products set data = data - 'wholesalePrice' - 'recommendedRetailPrice' - 'wholesalePriceConfirmed'
  - 'minOrderQty' - 'orderUnit' - 'mixOrderAllowed' - 'vatIncluded';

create policy products_vendor_read on public.products for select to authenticated using (vendor_id is not null and vendor_id = public.my_vendor_id());

-- 도매 판매 조건 (승인된 구매자·해당 도매처·관리자만 읽음)
create table public.product_wholesale (
  product_id text primary key references public.products(id) on delete cascade,
  price integer not null check (price > 0),
  min_qty integer not null default 1 check (min_qty >= 1),
  order_unit integer not null default 1 check (order_unit >= 1)
);
alter table public.product_wholesale enable row level security;

create or replace function public.can_buy_wholesale(p_product text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.products p
    where p.id = p_product and p.active and p.wholesale_enabled
      and ((p.wholesale_audience in ('business','both') and public.is_approved_business())
        or (p.wholesale_audience in ('vendors','both') and public.is_approved_vendor() and p.vendor_id is distinct from public.my_vendor_id()))
  ) or public.is_admin();
$$;

create policy wholesale_read on public.product_wholesale for select to authenticated
  using (public.can_buy_wholesale(product_id)
         or exists (select 1 from public.products p where p.id = product_id and p.vendor_id = public.my_vendor_id()));
create policy wholesale_admin_write on public.product_wholesale for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 매입가 (사입 거래·원가 계산용. 관리자·해당 도매처만)
create table public.product_costs (
  product_id text primary key references public.products(id) on delete cascade,
  supply_price integer not null default 0 check (supply_price >= 0)
);
alter table public.product_costs enable row level security;
create policy costs_read on public.product_costs for select to authenticated
  using (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.vendor_id = public.my_vendor_id()));
create policy costs_admin_write on public.product_costs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 중개 상품 판매자 정보(전자상거래법 표시용). 공개해도 되는 항목만.
create or replace function public.vendor_public_info(p_vendor uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('companyName', company_name, 'representative', representative,
    'businessNumber', business_number, 'mailOrderNumber', mail_order_number, 'address', address, 'phone', phone)
  from public.vendors where id = p_vendor and status = 'approved';
$$;

------------------------------------------------------------------------------
-- 3. 도매처 상품 등록 신청 → 대표 검수
------------------------------------------------------------------------------
create table public.product_submissions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index submissions_status_idx on public.product_submissions (status, created_at desc);
alter table public.product_submissions enable row level security;
create policy submissions_read on public.product_submissions for select to authenticated using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy submissions_vendor_insert on public.product_submissions for insert to authenticated
  with check (public.is_approved_vendor() and vendor_id = public.my_vendor_id() and status = 'pending'
    and (product_id is null or exists (select 1 from public.products p where p.id = product_id and p.vendor_id = public.my_vendor_id())));
create policy submissions_vendor_withdraw on public.product_submissions for update to authenticated
  using (vendor_id = public.my_vendor_id() and status = 'pending') with check (vendor_id = public.my_vendor_id() and status = 'withdrawn');
create policy submissions_admin_update on public.product_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 검수 승인: 신청 내용을 실제 상품에 반영하고, 거래 조건(대표가 정함)을 함께 저장한다.
-- p_terms: {dealType, commissionRate, wholesaleCommissionRate, fulfillment, publish}
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
    insert into public.products (id, slug, data, active, groupbuy_ends_at, vendor_id, consumer_mode, wholesale_enabled, wholesale_audience,
                                 deal_type, commission_rate, wholesale_commission_rate, fulfillment, sort)
    values (pid, pid, (pl->'data') || jsonb_build_object('id', pid, 'slug', pid), v_publish,
            nullif(pl->>'groupbuyEndsAt','')::timestamptz, s.vendor_id,
            coalesce(pl->>'consumerMode','retail'), coalesce((pl->>'wholesaleEnabled')::boolean, false), coalesce(pl->>'wholesaleAudience','business'),
            coalesce(p_terms->>'dealType', v.default_deal_type), coalesce((p_terms->>'commissionRate')::numeric, v.default_commission_rate),
            nullif(p_terms->>'wholesaleCommissionRate','')::numeric, coalesce(p_terms->>'fulfillment', pl->>'fulfillment', 'vendor'),
            (select coalesce(max(sort),0) + 1 from public.products));
  else
    pid := s.product_id;
    update public.products set
      data = (pl->'data') || jsonb_build_object('id', id, 'slug', slug),
      groupbuy_ends_at = nullif(pl->>'groupbuyEndsAt','')::timestamptz,
      consumer_mode = coalesce(pl->>'consumerMode', consumer_mode),
      wholesale_enabled = coalesce((pl->>'wholesaleEnabled')::boolean, wholesale_enabled),
      wholesale_audience = coalesce(pl->>'wholesaleAudience', wholesale_audience),
      deal_type = coalesce(p_terms->>'dealType', deal_type),
      commission_rate = coalesce((p_terms->>'commissionRate')::numeric, commission_rate),
      wholesale_commission_rate = case when p_terms ? 'wholesaleCommissionRate' then nullif(p_terms->>'wholesaleCommissionRate','')::numeric else wholesale_commission_rate end,
      fulfillment = coalesce(p_terms->>'fulfillment', fulfillment),
      active = case when p_terms ? 'publish' then v_publish else active end
    where id = pid;
  end if;

  if (pl->'wholesale'->>'price') is not null and (pl->'wholesale'->>'price')::int > 0 then
    insert into public.product_wholesale (product_id, price, min_qty, order_unit)
    values (pid, (pl->'wholesale'->>'price')::int, greatest(coalesce((pl->'wholesale'->>'minQty')::int,1),1), greatest(coalesce((pl->'wholesale'->>'orderUnit')::int,1),1))
    on conflict (product_id) do update set price = excluded.price, min_qty = excluded.min_qty, order_unit = excluded.order_unit;
  end if;
  if pl ? 'supplyPrice' then
    insert into public.product_costs (product_id, supply_price) values (pid, greatest(coalesce((pl->>'supplyPrice')::int,0),0))
    on conflict (product_id) do update set supply_price = excluded.supply_price;
  end if;

  update public.product_submissions set status = 'approved', product_id = pid, reviewed_at = now(),
    review_note = nullif(p_terms->>'note','') where id = p_submission;
  return pid;
end; $$;

