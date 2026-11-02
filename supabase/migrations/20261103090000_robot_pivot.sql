-- 2026-11-03 방향 전환: 니니랜드 = 직접 만든 변신로봇 판매 + 니니랜드 전용 아동복은 사업자 도매만
-- (20261027100100_members_vendors_part2.sql 적용 후 실행)

-- 아동복 5종: 일반 판매 끄고 사업자 도매 전용으로
update public.products
set consumer_mode = 'none',
    wholesale_enabled = true,
    wholesale_audience = 'business',
    groupbuy_ends_at = null,
    data = jsonb_set(data, '{category}', '"아동복"')
where id in ('roka-sleeveless-set','look-and-me-set','2025-eojjeol-kimjang-set','2025-eojjeol-kimjang-bonnet-set','lego-homewear');

-- 도매가는 예전 목업 값(확인 필요). 관리자 상품 관리에서 바로 고칠 수 있음.
insert into public.product_wholesale (product_id, price, min_qty, order_unit) values
  ('roka-sleeveless-set', 14000, 3, 1),
  ('look-and-me-set', 14000, 3, 1),
  ('2025-eojjeol-kimjang-set', 22000, 2, 1),
  ('2025-eojjeol-kimjang-bonnet-set', 27000, 2, 1),
  ('lego-homewear', 10000, 3, 1)
on conflict (product_id) do nothing;

-- 홈 문구
update public.store_settings
set data = data || jsonb_build_object(
  'heroTitle', '니니랜드가 직접 만든 변신로봇',
  'heroDescription', '손으로 바꾸며 노는 니니랜드 오리지널 변신로봇. 새 모델은 한정 예약으로 먼저 만나보세요.',
  'heroBadge', '한정 예약')
where id = 1;
