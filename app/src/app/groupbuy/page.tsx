'use client';

import { useMemo, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import styles from './groupbuy.module.css';

const statusOrder = ['예정', '진행중', '마감', '제작중', '입고예정', '배송준비중', '배송중', '종료'] as const;
type Status = (typeof statusOrder)[number];

function getStatus(badge: string): Status {
  if (badge.includes('배송준비')) return '배송준비중';
  if (badge.includes('배송중')) return '배송중';
  if (badge.includes('제작')) return '제작중';
  if (badge.includes('입고예정') || badge.includes('재입고')) return '입고예정';
  if (badge.includes('마감')) return '마감';
  if (badge.includes('종료')) return '종료';
  if (badge.includes('진행')) return '진행중';
  return '예정';
}

export default function GroupBuyPage() {
  const { products } = useMockStore();
  const [activeStatus, setActiveStatus] = useState<'전체' | Status>('전체');

  // 홈 화면과 동일한 기준(category === '공구상품')으로 통일해 노출 누락을 방지한다.
  const groupBuyProducts = useMemo(
    () => products.filter((product) => product.category === '공구상품'),
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      activeStatus === '전체'
        ? groupBuyProducts
        : groupBuyProducts.filter((product) => getStatus(product.badge) === activeStatus),
    [groupBuyProducts, activeStatus]
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>공구 · 배송일정</h1>
          <p>실시간 진행 중인 공구와 배송 예정 상품을 확인하세요</p>
        </div>

        <div className={styles.badgeList} role="group" aria-label="공구 상태 필터">
          <button
            type="button"
            onClick={() => setActiveStatus('전체')}
            className={`${styles.badgeButton} ${activeStatus === '전체' ? styles.activeBadge : ''}`}
          >
            전체
          </button>
          {statusOrder.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`${styles.badgeButton} ${activeStatus === status ? styles.activeBadge : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        <section className={styles.section}>
          <h2>진행 중인 공구 ({filteredProducts.length}개)</h2>
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon="📦"
              title="해당하는 공구 상품이 없습니다"
              description="다른 상태를 선택해보세요."
            />
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>공구 일정 안내</h2>
          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <span className={styles.label}>공구 진행 기간</span>
              <span>상품별 상세페이지에서 확인해주세요</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>제작 기간</span>
              <span>결제 확인 후 순차 제작</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>배송 예정</span>
              <span>제작 완료 후 순차 출고</span>
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
