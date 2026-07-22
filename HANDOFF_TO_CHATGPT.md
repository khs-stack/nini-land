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

**2026-07-22 추가 세션 (ChatGPT 작업 이어받아 버그 수정)**:
사용자가 ChatGPT에게 이어서 시켰던 작업(c47f3e2, f9c1b15 커밋)에서 실제 신고된 문제들을
코드로 직접 확인하고 수정함. 확정된 근본 원인:

- **[핵심 원인] 홈 화면(`page.tsx`)과 상품상세(`product/[slug]/page.tsx`)가 ChatGPT에 의해
  새로 작성되면서 새 CSS 클래스명(`colorButton`, `businessPricePanel`, `wholesaleIntro` 등)을
  썼는데, 대응 `.module.css` 파일이 업데이트되지 않아 해당 영역이 완전히 스타일 없이
  렌더링되고 있었음. "사진 깨짐", "옵션 선택 안 됨", "안 예쁨" 불만의 핵심 원인으로 판단됨.
  → 후보 zip(`candidate_not_applied`)의 올바른 CSS로 교체, 전체 파일 TSX-CSS 클래스 매칭
  스캔 완료 (스캔 스크립트: 각 page.tsx의 `styles.xxx` 사용과 대응 module.css의 `.xxx` 정의를
  비교). 현재 전체 프로젝트에서 이 유형의 불일치는 모두 해결됨.
- `/groupbuy` 페이지가 홈과 다른 필터 기준(`badge` 문자열)을 써서 공구상품 중 1개가
  안 보이던 버그 → 홈과 동일하게 `category === '공구상품'` 기준으로 통일, 상태 필터 버튼도
  실제 동작하도록 수정.
- 역할 전환(개발자 메뉴 `setDemoRole`) 시 장바구니에 이전 역할 가격이 남던 문제 → 초기화 추가.
- `createOrder`가 화면에서 전달된 배송비를 무조건 신뢰하던 문제 → 내부에서 재계산하는
  안전장치 추가 (무료배송 기준 5만원 통일).
- 예전 상품 링크 진입 시 "상품을 찾을 수 없습니다"만 뜨던 문제 → 홈/전체상품 링크가 있는
  안내 화면으로 개선.
- 후보 zip에서 안전하게 채택: 상품 전환 시 옵션/수량 초기화 useEffect, "바로 주문하기" 버튼.
- 레고/룩앤미/김장룩 도매가는 ChatGPT의 임시 추정값이므로 `wholesalePriceConfirmed` 필드를
  추가해 상품상세·관리자 화면에 "임시·확인 필요" 배지로 구분 표시. 로카나시세트(14,000원)만
  사용자 확정값이라 배지 없이 정상 표시.
- `/category/[name]` 페이지가 Next.js 15+에서 `params`를 Promise로 다뤄야 하는데 예전
  방식(props 직접 구조분해)을 써서 콘솔 경고 발생 → `useParams()` 훅으로 교체.
- 실제 `npm run dev`로 서버 띄워 홈/상품상세/카테고리/공구/장바구니/마이페이지/관리자/
  위시리스트/최근본상품 등 전 라우트 HTTP 200 및 서버 에러 없음 확인.
- 상품 문의(Q&A) 작성해도 새로고침하면 사라지던 버그 → `mockStore`에 `inquiries` 상태
  정식 추가해 localStorage에 영속화되도록 수정.
- **[또 다른 핵심 원인] 홈 화면 최상단 히어로 배너가 실제 상품 사진을 전혀 렌더링하지
  않고 있었음.** `page.tsx`는 `image`/`imagePosition`/`theme` 값을 세심하게 준비해뒀는데,
  `HeroBanner.tsx` 컴포넌트의 `Slide` 인터페이스와 렌더링 로직에 이 필드들이 아예 없어서
  `<img>` 자체가 렌더링되지 않고 단색 배경만 보이고 있었음. 후보 zip의 올바른
  `HeroBanner.tsx`/`.module.css`로 교체해 해결.
- 상품 카드(`ProductCard.module.css`)가 가로형(4:3) 비율로 이미지를 크롭하고 있었는데
  실제 상품 사진은 전부 세로형 인물 전신컷(1350×1800, 3:4)이라 얼굴/옷 아랫부분이 크게
  잘려나가던 문제 → 세로형(4:5)으로 수정. 상품상세 페이지 갤러리는 이미 4:5로 맞아있었음.

**최근 커밋 이력** (`git log --oneline` 기준, 오래된 순, 이번 세션 이전은 생략):
- `c47f3e2` 실제 상품 사진과 도매 상품 정보 반영 (ChatGPT 작업)
- `f9c1b15` HeroSlide 타입 빌드 오류 수정 (ChatGPT 작업)
- `b6ab7b0` 핵심 버그 수정: TSX-CSS 클래스 불일치 해결, 공구 페이지 필터 통일, 바로구매 버튼
- `3e57bb3` 역할전환 장바구니 오염 방지, 배송비 재계산 안전장치, 예전 링크 안내 개선
- `e6c7a41` 미확정 도매가 임시 표시 추가

**아직 확인/수정하지 않은 것 (다음 작업 시 우선)**:
- `QA_320_CHECKLIST.md` 320개 항목 중 아직 하나도 PASS/FIX/NA로 기록 안 함 —
  실제 브라우저 클릭 테스트(`npm run dev`)가 안 된 상태로, 코드 정적 분석 위주로 진행됨
- 관리자 CRUD 전체(공지/팝업/문의/반품 저장·수정·삭제·목록 반영) 재점검 필요
- 모바일 360px/390px 실제 반응형 확인 (CSS 자체는 있으나 브라우저로 미확인)
- 도매 최소수량 vs 재고 충돌 시 안내 메시지 세분화 (현재는 각각 별도 메시지만 존재)
- 원본 상품 사진 zip(`assets_source`)과 실제 반영된 이미지가 정확히 맞는지 육안 대조 안 함

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
