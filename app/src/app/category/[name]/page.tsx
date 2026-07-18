'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';
import styles from '../category.module.css';

interface CategoryPageProps {
  params: {
    name: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { products, user } = useMockStore();
  const categoryName = decodeURIComponent(params.name);

  const filtered = products.filter(
    (p) => p.category.toLowerCase() === categoryName.toLowerCase()
  );

  const showWholesalePrice = user.role === 'wholesale_approved' || user.role === 'admin';

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
              <article key={product.id} className={styles.productCard}>
                <Link href={`/product/${product.slug}`} className={styles.productLink}>
                  <div className={styles.imageWrap}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={200}
                      height={200}
                      priority={false}
                    />
                  </div>
                  <div className={styles.cardContent}>
                    <span className={styles.category}>{product.category}</span>
                    {product.badge && <span className={styles.badge}>{product.badge}</span>}
                    <h3>{product.name}</h3>
                    <p className={styles.description}>{product.description}</p>
                    <div className={styles.priceInfo}>
                      {showWholesalePrice ? (
                        <>
                          <span className={styles.wholesalePrice}>
                            도매가: {product.wholesalePrice.toLocaleString()}원
                          </span>
                          <span className={styles.consumerPrice}>
                            소비자가: {product.consumerPrice.toLocaleString()}원
                          </span>
                        </>
                      ) : (
                        <span className={styles.price}>
                          {product.consumerPrice.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
