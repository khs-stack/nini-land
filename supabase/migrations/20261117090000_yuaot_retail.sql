-- 2026-11-17 '유아봇'이 아니라 '유아옷' (오타 정정). 유아옷 먼저 판매, 변신로봇인형은 나중에.
-- 기존 아동복 5종 → 분류 '유아옷', 일반(소매) 판매로 전환. 사업자 도매는 당분간 끔(도매가 기록은 남김).
update public.products
set consumer_mode = 'retail',
    wholesale_enabled = false,
    groupbuy_ends_at = null,
    data = jsonb_set(data, '{category}', '"유아옷"')
where data->>'category' in ('아동복', '유아봇');

update public.store_settings
set data = data || jsonb_build_object(
  'heroTitle', '니니랜드가 직접 만든 유아옷',
  'heroDescription', '니니랜드가 직접 디자인하고 만든 우리 아이 옷. 편하고 귀엽게, 매일 입기 좋게.',
  'heroBadge', 'NINI LAND ORIGINAL')
where id = 1;
