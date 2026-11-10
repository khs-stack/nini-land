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
