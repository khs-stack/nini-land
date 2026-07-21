'use client';

import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';
import { ProductCard } from '../../components/ProductCard';
import styles from '../category.module.css';

interface CategoryPageProps {
  params: {
    name: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { products } = useMockStore();
  const categoryName = decodeURIComponent(params.name);

  const filtered = products.filter(
    (p) => p.category.toLowerCase() === categoryName.toLowerCase()
  );

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>{categoryName}</h1>
        <p>{filtered.length}개의 상품</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title="등록된 상품이 없습니다"
          description="곧 새로운 상품이 추가될 예정입니다."
          actionLabel="홈으로 돌아가기"
          actionHref="/"
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
