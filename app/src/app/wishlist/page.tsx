'use client';

import { EmptyState } from '../components/EmptyState';

export default function WishlistPage() {
  return (
    <EmptyState
      icon="❤️"
      title="관심상품이 없습니다"
      description="마음에 드는 상품을 찜하면 여기에 표시됩니다."
      actionLabel="쇼핑하기"
      actionHref="/"
    />
  );
}
