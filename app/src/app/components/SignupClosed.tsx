import { EmptyState } from './EmptyState';

/** 공구몰은 회원가입 없이 주문하므로 회원·도매회원 가입 화면을 닫아둔다. */
export function SignupClosed() {
  return (
    <main style={{ padding: 24 }}>
      <EmptyState icon="🛍️" title="회원가입 없이 주문할 수 있어요" description="상품을 고르고 바로 주문해주세요. 주문 후에는 주문번호와 연락처로 조회할 수 있습니다." actionLabel="공구 상품 보기" actionHref="/groupbuy" />
    </main>
  );
}
