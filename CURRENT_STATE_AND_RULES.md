# CURRENT_STATE_AND_RULES

## 프로젝트

- 이름: NiNi Land
- 목적: NiNi Land가 직접 디자인·생산한 아동복의 일반 소비자 + 승인된 도매사업자 통합 쇼핑몰
- 기술: Next.js App Router, TypeScript, React Context, localStorage, Vercel
- Next.js 실제 루트: `app/`
- GitHub: `khs-stack/nini-land`
- Vercel Root Directory: `app`
- 현재 목업 저장 키: `nini-mock-store`

## 현재 적용된 것으로 확인되는 변경

1. 실제 판매 상품 사진/상품정보 목업 반영
2. 새 상품 데이터용 public WebP 이미지 추가
3. 홈과 상품 상세 일부 수정
4. `HeroSlide` 타입 import 빌드 오류 수정
5. 로컬 `npm run build` 성공 후 Git push
6. Vercel 최신 빌드가 성공하여 사이트 반영

화면 기록상 Git push:
- `c47f3e2` 실제 상품 사진과 도매 상품 정보 반영
- `f9c1b15` HeroSlide 타입 빌드 오류 수정

실제 저장소에서 `git log`로 반드시 다시 확인하십시오.

## 아직 적용되지 않은 ChatGPT 후보 수정본

`candidate_not_applied/niniland_full_fix_NOT_APPLIED.zip`

후보 수정 의도:
- 상품 분류 페이지 노출 보완
- 옵션 선택·수량·장바구니·주문 흐름 보완
- 상품 카드/상세 이미지 비율 조정
- 공구 상품과 주문 상세 보완
- 목업 데이터 버전 갱신

주의:
- 사용자가 후보 ZIP을 적용하지 않았음
- 최종 품질을 보증하지 않음
- 후보 코드 자체에도 추가 문제 가능
- `chatgpt_candidate_src_changes.patch`로 원본 업로드 당시 코드 대비 텍스트 변경을 참고할 수 있음
- 현재 Git 저장소와 후보를 직접 비교한 후 선별 적용할 것

## 반드시 유지할 권한/가격 원칙

- 비회원/일반회원/승인대기:
  - 소비자가만 노출
  - 도매가 숫자와 권장소비자가 숫자를 노출하지 않음
  - “사업자 인증 후 별도 도매가격 확인” 안내
- 승인된 도매회원/관리자:
  - 도매가
  - 권장소비자가
  - 최소 주문수량
  - 주문단위
  - 컬러/사이즈 혼합 가능 여부
  - VAT 포함/별도
- 목업 단계라도 역할이 바뀌면 기존 장바구니 가격 스냅샷이 다른 역할에 남지 않도록 처리
- 실제 Supabase 연결 시 서버 응답/RLS로 보호할 예정이나 지금은 연결하지 않음

## 테스트 계정

목업 로그인은 이메일 문자열로 role을 결정하며 비밀번호는 아무 값이나 가능:

- `admin@nini-land.com` → 관리자
- `member@nini-land.com` → 일반회원
- `wholesale@nini-land.com` → 승인 도매회원
- `pending@nini-land.com` → 승인대기
- 로그아웃 → 비회원

현재 실제 구현이 이 규칙과 다른지 먼저 확인하십시오.

## localStorage 주의

- 저장된 구버전 상품/장바구니가 새 코드와 충돌할 수 있음
- 버전 마이그레이션을 명시적으로 관리할 것
- 사용자의 주문/주소 같은 데이터를 이유 없이 모두 초기화하지 말 것
- 상품 seed만 바뀔 때 어떤 상태를 유지하고 어떤 상태를 갱신할지 분리할 것
- 개발 테스트 시 시크릿창 또는 별도 localStorage 초기화 절차를 사용하되 실제 사용자에게는 영향 설명

## 완료 보고 방식

사용자에게는 다음만 간단히 보고:
1. 발견한 큰 문제 수
2. 실제 수정한 범위
3. 테스트 결과
4. 변경 파일 전체 경로
5. 실행/커밋 명령 한 줄씩
6. 남은 외부 연동 항목(Supabase/PG 등)
