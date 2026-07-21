'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';

export default function WishlistPage() {
  const { products, wishlist, toggleWishlist } = useMockStore();
  const items = useMemo(() => products.filter((p) => wishlist.includes(p.id)), [products, wishlist]);

  if (items.length === 0) {
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

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>관심상품 ({items.length})</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((product) => (
          <div key={product.id} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 16, padding: 12, boxShadow: '0 8px 20px rgba(17,17,17,0.06)' }}>
            <img src={product.image} alt={product.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', background: '#f7f7f7', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Link href={`/product/${product.slug}`} style={{ fontWeight: 700 }}>{product.name}</Link>
              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{product.consumerPrice.toLocaleString()}원</div>
            </div>
            <button type="button" onClick={() => toggleWishlist(product.id)} style={{ border: 0, background: 'none', fontSize: 20, cursor: 'pointer', alignSelf: 'flex-start' }} aria-label="관심상품에서 제거">
              ❤️
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
