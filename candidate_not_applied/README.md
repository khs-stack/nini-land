# 후보 수정본 안내

파일: `niniland_full_fix_NOT_APPLIED.zip`

이 ZIP은 ChatGPT가 사용자의 문제 제보 뒤 만든 후보 수정본입니다.

## 중요

- 사용자는 이 ZIP을 로컬에 적용하지 않았습니다.
- 현재 GitHub/Vercel 코드와 다릅니다.
- 검증 완료 최종본이 아닙니다.
- 통째로 덮어쓰지 마십시오.
- 임시 도매가가 포함돼 있습니다.
- 이미지 매칭 및 실제 UI 품질이 추가 검증되어야 합니다.

## 활용 방법

1. 현재 저장소를 우선 빌드하고 테스트
2. 후보 ZIP은 저장소 바깥 임시 폴더에서만 열기
3. `chatgpt_candidate_src_changes.patch`와 파일별 diff 확인
4. 문제를 해결하는 코드만 선택적으로 반영
5. 반영한 파일마다 lint/ts/build/browser test
6. 사용자 확정이 없는 가격/정책은 명시적으로 미확정 처리

## 후보에서 변경된 주요 텍스트 파일

- `app/src/app/page.tsx`
- `app/src/app/page.module.css`
- `app/src/app/layout.tsx`
- `app/src/app/lib/mockProducts.ts`
- `app/src/app/lib/mockStore.tsx`
- `app/src/app/components/HeroBanner.tsx`
- `app/src/app/components/HeroBanner.module.css`
- `app/src/app/components/ProductCard.tsx`
- `app/src/app/components/ProductCard.module.css`
- `app/src/app/category/[name]/page.tsx`
- `app/src/app/category/category.module.css`
- `app/src/app/groupbuy/page.tsx`
- `app/src/app/groupbuy/groupbuy.module.css`
- `app/src/app/product/[slug]/page.tsx`
- `app/src/app/product/[slug]/ProductDetail.module.css`
- `app/src/app/cart/page.tsx`
- `app/src/app/cart/Cart.module.css`
- `app/src/app/orders/[id]/page.tsx`
- `app/src/app/orders/[id]/OrderDetail.module.css`

새 이미지:
- `app/public/products/2026-collection/*.webp`
