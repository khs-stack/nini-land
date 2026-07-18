'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';
import styles from './search.module.css';

function SearchContent() {
  const searchParams = useSearchParams();
  const { products, user } = useMockStore();
  const query = searchParams.get('q') || '';

  const filtered = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showWholesalePrice = user.role === 'wholesale_approved' || user.role === 'admin';

  return (
    <>
      <div className={styles.header}>
        <h1>검색 결과</h1>
        <p>검색어: <strong>{query}</strong></p>
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
            {filtered.length}개의 상품을 찾았습니다
          </div>

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
