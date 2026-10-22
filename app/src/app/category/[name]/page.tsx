'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { EmptyState } from '../../components/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import { useMockStore } from '../../lib/mockStore';
import styles from '../category.module.css';

type SortKey = 'default' | 'priceAsc' | 'priceDesc';

export default function CategoryPage() {
  const params = useParams<{ name: string }>();
  const { products } = useMockStore();
  const [sort, setSort] = useState<SortKey>('default');
  const rawName = Array.isArray(params.name) ? params.name[0] : params.name;
  const categoryName = decodeURIComponent(rawName || '전체상품');

  const filtered = useMemo(() => {
    const base = categoryName === '전체상품'
      ? [...products]
      : products.filter((product) => product.category.toLowerCase() === categoryName.toLowerCase());

    if (sort === 'priceAsc') base.sort((a, b) => (a.discountPrice || a.consumerPrice) - (b.discountPrice || b.consumerPrice));
    if (sort === 'priceDesc') base.sort((a, b) => (b.discountPrice || b.consumerPrice) - (a.discountPrice || a.consumerPrice));
    return base;
  }, [categoryName, products, sort]);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>NINI LAND COLLECTION</p>
          <h1>{categoryName}</h1>
          <span>{filtered.length}개의 상품</span>
        </div>
        <label className={styles.sortLabel}>
          <span className="visually-hidden">상품 정렬</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="default">기본순</option>
            <option value="priceAsc">낮은가격순</option>
            <option value="priceDesc">높은가격순</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title="등록된 상품이 없습니다"
          description="상품 데이터가 초기화되지 않았거나 아직 해당 분류에 상품이 없습니다."
          actionLabel="전체 상품 보기"
          actionHref="/search"
        />
      ) : (
        <div className={styles.container}>
          <div className={styles.productGrid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
