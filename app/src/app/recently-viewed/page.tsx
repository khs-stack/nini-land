'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';

export default function RecentlyViewedPage() {
  const { products, recentlyViewed } = useMockStore();
  const items = useMemo(
    () => recentlyViewed.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p),
    [products, recentlyViewed]
  );

  if (items.length === 0) {
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

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>최근 본 상품 ({items.length})</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 16, padding: 12, boxShadow: '0 8px 20px rgba(17,17,17,0.06)' }}
          >
            <img src={product.image} alt={product.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', background: '#f7f7f7', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>{product.name}</div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{product.consumerPrice.toLocaleString()}원</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
