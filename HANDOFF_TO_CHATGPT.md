# HANDOFF_TO_CHATGPT.md — 니니랜드 프로젝트 인수인계 문서

Claude(Claude Code)에서 ChatGPT로 작업을 넘길 때 이 문서를 함께 첨부하고,
맨 아래 "ChatGPT에게 줄 명령문"을 그대로 복붙해서 사용한다.

---

## 1. 프로젝트 개요

- **NiNi Land**: 아동복 도·소매 통합 쇼핑몰 (Next.js + TypeScript, App Router)
- 실제 DB(Supabase) 연동 전 단계 — 현재 모든 데이터는 `mockStore.tsx`의
  React Context + `localStorage`(`nini-mock-store` 키)에 저장되는 **목업 상태**
- GitHub: `github.com/khs-stack/nini-land` (private → 필요시 public 전환해서 작업)
- 배포: Vercel `nini-land.vercel.app` (GitHub main 브랜치 push 시 자동 재배포)
- 개발 환경: VS Code + Claude Code 확장 (Windows, 사용자는 비개발자에 가까움 —
  터미널/git 명령을 한 줄씩 복붙해서 실행하는 방식으로 진행해왔음)

## 2. 지금까지 완료된 작업 (요약 — 마지막 업데이트: 아래 커밋까지 반영됨)

**최근 커밋 이력** (`git log --oneline ba9c0af..HEAD` 기준, 오래된 순):
- `f1e035f` 디자인 시스템 토큰 정리, 위시리스트 실제 동작, 홈 신상품/베스트 섹션 분리, 하단 탭바/스크롤버튼, 정렬 기능
- `3a61343` 상품 옵션/이미지갤러리/탭구조/QnA, 배송지관리, 회원정보수정, 히어로배너, 관리자 레이아웃
- `67a5dc1` 관리자 다중이미지업로드/검색필터, 안전거래 안내, 로딩/404/에러 페이지
- `1829274` 최근 본 상품 실제 동작 연결, 사업자정보 관리 페이지
- `129bdc9` 브랜드 파비콘/OG 메타데이터, 접근성 aria-label 보강
- `4eba101` 장바구니 하단 고정 결제바, 주문완료 체크마크 애니메이션
- `5d89fc8` 상품 상세 페이지 인라인 style → CSS Module 전면 이관
- `43cc1a9` 장바구니 페이지 인라인 style → CSS Module 전면 이관
- `86e290a` 주문 상세 페이지 인라인 style → CSS Module 전면 이관

1. 기획 문서 8종 작성 (`docs/CLAUDE.md`, `PROJECT_SPEC.md`, `SCREEN_FLOW.md`,
   `DB_SCHEMA.md`, `TASKS.md`, `DECISIONS.md`, `SECURITY_CHECKLIST.md`, `BUG_LOG.md`)
2. `REQUIREMENTS_CHECKLIST_4.md` 기준 108개 기능 항목 대부분 구현
3. `DESIGN_ACTIVATION_CHECKLIST.md` 기준 100개 항목 중 A~G 대부분 완료:
   - 디자인 시스템 토큰, 헤더/하단탭바/스크롤버튼
   - 홈 신상품/베스트 섹션, 카테고리 퀵링크, 상품카드 공통화(찜하기/할인배지)
   - 상품 상세: 이미지갤러리, 컬러/사이즈 옵션, 수량조절, 탭구조(정보/리뷰/문의), 안전거래 안내
   - 마이페이지: 카드형 메뉴, 배송지관리, 회원정보수정, 사업자정보관리, 최근본상품/위시리스트 실제 연동
   - 관리자: 전용 레이아웃(사이드바), 상품 CRUD+다중이미지업로드, 회원/주문/취소교환반품 관리 + 검색·필터
   - 전역: loading.tsx(상품상세/카테고리), not-found.tsx, global-error.tsx

**남은 것 (DESIGN_ACTIVATION_CHECKLIST.md 기준 H~J 위주)**:
- 인라인 style을 CSS Module로 전면 이관 (성능/유지보수, 아직 페이지별로 인라인 style 많이 남음)
- 파비콘/OG 이미지 브랜드화, Lighthouse 성능/접근성 점검
- 접근성 세부 점검 (색 대비, 키보드 포커스, aria-label 커버리지)
- 실제 Supabase 연동, 결제 PG 연동, 실제 카카오/네이버 로그인 — **아직 전혀 안 함**

## 3. 반드시 지켜야 할 규칙 (중요)

1. **기존 기능/디자인을 임의로 삭제·축소하지 않는다.** 범위를 줄여야 하면
   `docs/DECISIONS.md`에 사유를 기록하고 사용자에게 먼저 알린다.
2. **아직 Supabase 연동하지 않는다.** 계속 `mockStore.tsx` 기반 목업 데이터로 진행.
   (사용자가 명시적으로 "이제 Supabase 연결하자"고 하기 전까지)
3. **도매가 노출 로직 유지**: 비회원/일반회원 화면에는 도매가 필드 자체가 안 보이게
   하는 원칙(서버 검증 흉내)을 유지한다. UI에서 CSS로 숨기는 방식 금지.
4. **작업 전 계획 보고**: 큰 작업 시작 전 "현재 구조 / 수정할 파일 / 예상 문제"를
   먼저 요약해서 사용자에게 확인받고 진행한다.
5. **파일 구조 주의**: 이 프로젝트는 `니니랜드/app/` 폴더가 실제 Next.js 루트다.
   압축파일로 파일을 주고받을 때 `app/src/app/...` 구조를 정확히 지켜야 하며,
   과거 사용자가 파일을 잘못된 하위 폴더(`privacy` 폴더 등)에 덮어써서
   빌드가 깨진 적이 있으니, **덮어쓸 위치를 명확히 알려줘야 한다.**
6. **Git 커밋 단위**: 작업 마칠 때마다 의미 있는 단위로 커밋 메시지를 남기고,
   `npm run build` 또는 최소 `npx tsc --noEmit`으로 에러 없는지 확인한 뒤 안내한다.
7. **사용자는 비개발자**: 터미널 명령은 항상 "한 줄씩 복붙 가능한 코드블록"으로
   주고, 클릭 단위로 설명한다. Git/GitHub/Vercel 용어도 풀어서 설명해야 한다.
8. **이미지**: 현재 상품 이미지는 관리자가 업로드하면 base64로 변환되어
   localStorage에 저장되는 방식(실제 파일 서버 없음). 용량이 크면 브라우저가
   느려질 수 있음을 인지하고 작업.

## 4. ChatGPT에게 줄 명령문 (복붙용)

```
첨부한 zip은 Next.js(App Router) + TypeScript로 만든 "니니랜드" 아동복
도소매 쇼핑몰 프로젝트야. 실제 백엔드(Supabase) 연동 전 단계이고, 모든 데이터는
app/src/app/lib/mockStore.tsx의 React Context + localStorage로 관리되는 목업 상태야.

먼저 아래 문서들을 읽고 시작해줘 (zip 안 docs 폴더에 있음):
- CLAUDE.md, PROJECT_SPEC.md, SCREEN_FLOW.md, DB_SCHEMA.md
- REQUIREMENTS_CHECKLIST_4.md (기능 요구사항 108개, 완료여부 표시돼있음)
- DESIGN_ACTIVATION_CHECKLIST.md (디자인/활성화 100개 항목)
- HANDOFF_TO_CHATGPT.md (지금 이 문서 — 지켜야 할 규칙 포함)

작업 방식:
1. 지금까지 뭐가 됐고 안 됐는지 두 체크리스트 기준으로 먼저 파악해서 보고해줘
2. HANDOFF_TO_CHATGPT.md의 "반드시 지켜야 할 규칙"을 그대로 따라줘
   (기존 기능 삭제 금지, Supabase 아직 연동 안 함, 도매가 노출 원칙 유지,
   비개발자 사용자 기준으로 안내, 파일 구조 정확히 지키기)
3. DESIGN_ACTIVATION_CHECKLIST.md의 남은 항목(G~J: 관리자 화면 고도화,
   인라인 style 정리, 성능/접근성, 브랜딩 보강)부터 이어서 진행해줘
4. 다 되면 수정된 파일들을 zip으로 묶어서 다운로드 가능하게 해줘.
   (나는 그 파일을 로컬 프로젝트 폴더에 덮어쓰고 GitHub에 직접 push할 거야)
5. 파일 위치는 항상 "app/src/app/..." 형태의 전체 경로로 알려줘.
   나는 코딩을 잘 몰라서 어디에 뭘 덮어써야 하는지 정확히 알아야 해.
```

## 5. GitHub/배포 관련 참고 정보

- 저장소: `https://github.com/khs-stack/nini-land.git`
- 배포: Vercel (`Root Directory: app` 로 설정되어 있음, 새 push 시 자동 재배포)
- 로컬 git 사용자 설정: `git config --global user.name/user.email` 이미 완료된 PC 기준
- 로그인 테스트 계정 (아이디에 특정 단어 포함 여부로 role 결정되는 방식):
  - `admin@nini-land.com` → 관리자
  - `member@nini-land.com` → 일반회원
  - `wholesale@nini-land.com` → 도매회원
  - `pending@nini-land.com` → 사업자 승인대기
  - 비밀번호는 아무 값이나 입력해도 통과됨 (실제 인증 아님)
