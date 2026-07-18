'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMockStore } from '../lib/mockStore';
import styles from './groupbuy.module.css';

const groupBuyBadges = ['예정', '진행중', '마감', '제작중', '입고예정', '배송준비중', '배송중', '종료'];

export default function GroupBuyPage() {
  const { products, user } = useMockStore();

  const groupBuyProducts = products.filter((p) => p.badge.includes('공구') || p.badge.includes('재입고'));

  const showWholesalePrice = user.role === 'wholesale_approved' || user.role === 'admin';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>공구 · 배송일정</h1>
          <p>실시간 진행 중인 공구와 배송 예정 상품을 확인하세요</p>
        </div>

        <div className={styles.badgeList}>
          {groupBuyBadges.map((badge) => (
            <span key={badge} className={styles.badgeButton}>{badge}</span>
          ))}
        </div>

        <section className={styles.section}>
          <h2>진행 중인 공구</h2>
          <div className={styles.productGrid}>
            {groupBuyProducts.map((product) => (
              <article key={product.id} className={styles.productCard}>
                <Link href={`/product/${product.slug}`} className={styles.productLink}>
                  <div className={styles.imageWrap}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={200}
                      height={200}
                    />
                    <div className={styles.badge}>{product.badge}</div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{product.name}</h3>
                    {showWholesalePrice ? (
                      <>
                        <div className={styles.wholesalePrice}>
                          {product.wholesalePrice.toLocaleString()}원
                        </div>
                        <div className={styles.consumerPrice}>
                          소비자가 {product.consumerPrice.toLocaleString()}원
                        </div>
                      </>
                    ) : (
                      <div className={styles.price}>
                        {product.consumerPrice.toLocaleString()}원
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>공구 일정 안내</h2>
          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <span className={styles.label}>공구 진행 기간</span>
              <span>2024-07-20 ~ 2024-07-27</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>제작 기간</span>
              <span>2024-07-28 ~ 2024-08-10</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>배송 예정</span>
              <span>2024-08-11 이후</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>배송 지연 상품</h2>
          <div className={styles.delayNotice}>
            <strong>⚠️ 현재 배송 지연 상품 없음</strong>
            <p>모든 상품이 정상 배송 일정을 유지하고 있습니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
