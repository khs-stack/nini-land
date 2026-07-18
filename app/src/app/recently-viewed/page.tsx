'use client';

import { EmptyState } from '../components/EmptyState';

export default function RecentlyViewedPage() {
  return (
    <EmptyState
      icon="👀"
      title="최근 본 상품이 없습니다"
      description="상품 상세 페이지에 방문하면 여기에 저장됩니다."
      actionLabel="쇼핑 시작하기"
      actionHref="/"
    />
  );
}
