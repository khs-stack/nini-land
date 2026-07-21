'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import styles from './search.module.css';

type SortKey = 'default' | 'priceAsc' | 'priceDesc';

function SearchContent() {
  const searchParams = useSearchParams();
  const { products } = useMockStore();
  const query = searchParams.get('q') || '';
  const [sort, setSort] = useState<SortKey>('default');

  const filtered = useMemo(() => {
    const base = query
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        )
      : products;

    const sorted = [...base];
    if (sort === 'priceAsc') sorted.sort((a, b) => a.consumerPrice - b.consumerPrice);
    if (sort === 'priceDesc') sorted.sort((a, b) => b.consumerPrice - a.consumerPrice);
    return sorted;
  }, [products, query, sort]);

  return (
    <>
      <div className={styles.header}>
        <h1>{query ? '검색 결과' : '전체 상품'}</h1>
        {query && <p>검색어: <strong>{query}</strong></p>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="검색 결과가 없습니다"
          description={`"${query}"에 관한 상품을 찾을 수 없습니다.`}
          actionLabel="홈으로 돌아가기"
          actionHref="/"
        />
      ) : (
        <div className={styles.container}>
          <div className={styles.resultCount}>
            <span>{filtered.length}개의 상품</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="default">기본순</option>
              <option value="priceAsc">낮은가격순</option>
              <option value="priceDesc">높은가격순</option>
            </select>
          </div>

          <div className={styles.productGrid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<div style={{ padding: '40px 16px', textAlign: 'center' }}>로딩 중...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
