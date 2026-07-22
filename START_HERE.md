# START_HERE — NiNi Land Claude Code 인수인계

## 0. 가장 중요한 현재 상태

- 로컬/GitHub/Vercel에 **현재 적용된 마지막 확인 커밋**은 화면 기록상 `f9c1b15`
  (`HeroSlide 타입 빌드 오류 수정`)입니다.
- 그 직전 커밋 `c47f3e2`에는 실제 상품 사진/상품정보 업데이트가 들어갔습니다.
- `candidate_not_applied/niniland_full_fix_NOT_APPLIED.zip`은 ChatGPT가 추가 보완한 **후보 수정본**이지만,
  사용자가 아직 로컬 프로젝트에 적용하지 않았습니다.
- 후보 ZIP을 프로젝트에 통째로 덮어쓰지 마십시오. 현재 저장소와 비교한 뒤 필요한 변경만 선별 반영하십시오.
- 실제 백엔드 Supabase는 아직 연결하지 않습니다. 모든 상태는
  `app/src/app/lib/mockStore.tsx`의 React Context + localStorage 목업입니다.

## 1. 먼저 읽을 파일 순서

1. 현재 저장소 루트의 `CLAUDE.md`
2. 현재 저장소의 `PROJECT_SPEC.md`, `SCREEN_FLOW.md`, `DB_SCHEMA.md`
3. `REQUIREMENTS_CHECKLIST_4.md`
4. `HANDOFF_TO_CHATGPT.md`
5. 이 인수인계 폴더의 `CURRENT_STATE_AND_RULES.md`
6. `KNOWN_ISSUES.md`
7. `PRODUCT_DATA.md`
8. `QA_320_CHECKLIST.md`
9. `candidate_not_applied/README.md`

현재 저장소에 문서가 없거나 내용이 다르면 `docs_reference/`를 참고만 하되,
항상 실제 저장소의 최신 코드와 Git 이력을 우선합니다.

## 2. 작업 목표

사용자가 일일이 문제를 찾아 전달하지 않아도 되도록 Claude가 직접 다음을 수행합니다.

- 현재 배포/로컬의 전체 화면과 클릭 흐름 전수 점검
- 상품 이미지·옵션·가격·카테고리·장바구니·주문 흐름 정상화
- 일반회원/도매회원/승인대기/관리자 권한별 가격 및 기능 분기 검증
- 관리자 화면 실제 운영 가능 수준으로 보완
- 모바일·PC 반응형, 접근성, 오류/빈 상태, 성능 보완
- `QA_320_CHECKLIST.md` 320항목을 PASS/FIX/NA로 기록
- 수정 후 lint, TypeScript, production build, 핵심 사용자 흐름 테스트
- 기존 기능 삭제 없이 한 번에 안정적인 커밋 단위로 반영

## 3. 사용자 특성

- 사용자는 비개발자에 가깝습니다.
- 설명은 짧고 정확하게 하며 파일 경로는 항상 `app/src/app/...` 전체 경로로 씁니다.
- 터미널 명령은 한 줄씩 복사 가능한 코드블록으로 제공합니다.
- 용어보다 “어디를 클릭하고 무엇을 확인할지”를 우선 안내합니다.
- 중간 산출물을 계속 덮어쓰게 하지 말고, 충분히 검증한 최종 변경만 안내합니다.

## 4. 작업 금지 사항

- 기존 기능/화면 임의 삭제 또는 축소 금지
- 사용자 승인 없이 Supabase/실결제/실제 소셜 로그인 연동 금지
- 일반/비회원에게 도매가 필드 전달 또는 렌더링 금지
- 별도 새 Next.js 프로젝트 생성 금지
- 별도 Vercel 사본/새 배포 프로젝트 생성 금지
- 후보 ZIP 전체를 무검토 덮어쓰기 금지
- “빌드 성공”만으로 완료 처리 금지
- 샘플 이미지나 관계없는 사진으로 교체 금지
- 추측한 도매가를 확정값처럼 표시 금지

## 5. 첫 실행 순서

```powershell
git status
```

```powershell
git log -8 --oneline
```

```powershell
cd app
```

```powershell
npm install
```

```powershell
npm run lint
```

```powershell
npx tsc --noEmit
```

```powershell
npm run build
```

그 후 로컬 실행:

```powershell
npm run dev
```

브라우저에서 홈부터 관리자까지 실제 클릭 테스트를 수행하고,
`QA_320_CHECKLIST.md`에 증상·수정 파일·검증 결과를 기록합니다.

## 6. 완료 조건

- 320개 QA 항목 상태 기록
- 치명/높음 우선순위 문제 0개
- 상품 대표사진과 상품명이 자연스럽게 일치
- 컬러/사이즈/수량을 선택하지 않으면 장바구니·바로주문 불가
- 전체보기/신상품/베스트/공구/검색에서 올바른 상품 노출
- 일반/비회원에게 도매가 값이 상태/DOM/localStorage/화면에 잘못 노출되지 않음
- 도매 주문 최소수량/주문단위/재고 검사 일치
- 주문 생성→주문완료→주문상세 흐름 정상
- 관리자 CRUD/상태변경 흐름 정상
- 모바일 360px, 390px, 태블릿, PC에서 주요 화면 깨짐 없음
- `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과
- 변경 파일과 테스트 결과를 사용자에게 간단히 보고
