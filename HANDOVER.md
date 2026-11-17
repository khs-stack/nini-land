# 니니랜드 인수인계 (2026-11-10)

## 한 줄 요약
니니랜드 = 직접 만든 **변신로봇** 쇼핑몰 (상시 판매 + 한정 예약 + 가게 사업자 도매). 아동복 5종은 사업자 도매 전용.
코드는 다 만들어졌고, **DB 변경 2개 적용 → 테스트 → main 배포**만 남음.

## 위치
- GitHub: khs-stack/nini-land — 작업 브랜치 `marketplace` (main 아님)
- 앱 폴더: `app/` (Next.js + TypeScript)
- 사이트: https://nini-land.vercel.app (지금은 예전 아동복 공구 버전, 주문 닫힘)
- Supabase 프로젝트: `nini-land` / id `jauftiyvtxxhcdnjebbh` (서울, 무료 플랜 — 일주일 안 쓰면 잠듦 → restore_project로 깨움)
- Vercel 프로젝트: `nini-land` (prj_BTlIDK9LJfnN6VmROnoDeBVCx0SY), 환경변수 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 설정 완료
- 관리자 계정: khs@menuit.io (비밀번호는 형석이 알고 있음)

## DB 상태
- 적용됨: `20261026090000_init_groupbuy_shop.sql`, `20261026091000_store_open_gate.sql`, `20261027100000_members_vendors_part1.sql`
- **아직 안 됨 (순서대로 적용):**
  1. `supabase/migrations/20261027100100_members_vendors_part2.sql` (주문·출고·정산 구조, place_order 교체)
  2. `supabase/migrations/20261103090000_robot_pivot.sql` (아동복 → 도매 전용, 홈 문구)
- 주의: part2 적용 시 Supabase 커넥터가 사용자 승인을 물어봄 → 형석이 앱 화면 띄워두고 바로 "허용" 눌러야 함 (4분 지나면 취소됨).
  확인용: `select exists(select 1 from information_schema.columns where table_name='orders' and column_name='user_id')` → true면 part2 적용된 것

## 2026-11-12 진행 기록
- 1~4번 완료: part2·robot_pivot·tighten_rpc_grants 적용, 시나리오 테스트 전부 통과(롤백), 보안 점검, 빌드 통과, main 배포.
- 남은 건 5·6번(형석이 대시보드/관리자에서 직접).
- 참고: 지금 DB엔 아동복 5종(도매 전용)만 있음 → 로봇 상품은 관리자에서 새로 등록해야 일반 손님이 살 수 있음.

## 2026-11-17 (2) 유아옷 정정 · 홈 꾸미기 · 팝업 · 가입 동의
- '유아봇'은 오타였음 → **유아옷**. 기존 아동복 5종을 분류 '유아옷' + 소매 판매로 전환 (도매 끔, 도매가 기록은 남김)
- 관리자 → **홈 화면 꾸미기**(/admin/home): 문구, 구역 순서(▲▼)·보이기, 바로가기 버튼 편집. store_settings.data에 저장
- 관리자 → **팝업 관리**(/admin/popup): 팝업창/띠 공지, 이미지·링크·기간·순서. store_settings.data.popups에 저장 (이제 DB 저장, 전엔 브라우저에만)
- 카카오 가입 버튼 앞에 필수 동의 3개(만 14세 이상 / 이용약관 / 개인정보 수집·이용)
- 쇼핑몰 설정 화면 저장은 홈·팝업 칸을 덮어쓰지 않음 (HOME_KEYS 제외)

## 2026-11-17 추가 (회원 등급·결제 할인)
- 판매 순서: **유아옷 먼저** (처음에 '유아봇'으로 잘못 알아들음). 분류 '변신로봇'(변신로봇인형)은 손님 화면에서 숨김 → 다시 열려면 `app/src/app/lib/mockProducts.ts`의 `HIDDEN_CATEGORIES`에서 빼면 됨
- 회원 등급 3개: 소매(일반) / 지인(관리자가 등업) / 사업자 도매(당분간 안 씀 — 상품에서 도매 체크 안 하면 꺼짐)
  - 지인 등업: 관리자 → 회원 관리 → '회원 · 지인 등급' 탭 → '지인으로 등업'
  - 지인가는 지인·관리자에게만 서버가 내려줌 (product_friend 테이블)
- 결제수단: 계좌이체 / 카드. 상품마다 등급×결제수단 할인율(%) 입력 (상품 편집 → '결제수단별 할인율')
  - **카드는 PG 계약 전이라 막혀 있음** (store_settings.cardPaymentEnabled=false, 서버도 차단). PG(토스페이먼츠 등) 연결 작업 후에 켤 것. 지금은 켜도 실제 카드 결제창이 없음
- DB: `20261116090000_friend_tier_payment_discounts.sql` 적용됨, 시나리오 테스트 11개 통과

## 남은 일 (순서)
1. part2 → robot_pivot 마이그레이션 적용
2. DB에서 시나리오 테스트 (롤백 트랜잭션): 비회원 주문 / 승인 사업자 도매 주문(최소수량) / 미승인자 도매 차단 / 주문 조회·취소 / 가게 닫힘 차단
3. `get_advisors`(security) 확인
4. `app`에서 `npm run build` 통과 확인 → `marketplace`를 main에 머지·푸시 → Vercel 배포 Ready 확인
5. 형석이 Supabase 대시보드에서 직접 할 것 (도구 없음):
   - Authentication → Email → Confirm email 끄기
   - URL Configuration → Site URL `https://nini-land.vercel.app`, Redirect `https://nini-land.vercel.app/**`
   - 카카오 로그인 설정 (순서는 OPERATIONS.md)
6. 형석이 관리자 → 쇼핑몰 설정에 사업자정보·계좌 넣고 "주문 받기 시작"

## 정해진 것 (DECISIONS.md 참고)
- 일반 고객: 비회원 주문 + 카카오 간편가입(선택). 사업자: 이메일 가입 필수 + 등록증 → 관리자 승인 후 도매가 보임
- 결제: 무통장입금만 (가격·배송비·마감·품절은 서버 place_order에서 재계산)
- 입점 도매처 기능: 도매처 규정상 불가 → `VENDOR_MARKETPLACE_ENABLED=false`로 화면만 숨김 (코드·DB 유지)
- 로봇은 어린이용 → KC 인증번호·사용연령 필수 표시 (상품 편집기에 칸 있음)
- 아동복 도매가(1만~2.7만원)는 예전 샘플 값 — 형석 확인 필요

## 소통 방식
- 형석은 초보자. 반말 짧게(~함/~음), 쉬운 말로, 할 일은 번호로.
