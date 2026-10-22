'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import styles from './groupbuy.module.css';

const groupBuyStatuses = ['전체', '예정', '진행중', '마감', '제작중', '입고예정', '배송준비중', '배송중', '종료'] as const;
type GroupBuyStatus = (typeof groupBuyStatuses)[number];

function getStatus(badge: string): Exclude<GroupBuyStatus, '전체'> {
  if (badge.includes('배송준비')) return '배송준비중';
  if (badge.includes('배송중')) return '배송중';
  if (badge.includes('제작')) return '제작중';
  if (badge.includes('입고예정')) return '입고예정';
  if (badge.includes('마감')) return '마감';
  if (badge.includes('종료')) return '종료';
  if (badge.includes('예정')) return '예정';
  return '진행중';
}

export default function GroupBuyPage() {
  const { products, user } = useMockStore();
  const [activeStatus, setActiveStatus] = useState<GroupBuyStatus>('전체');

  const groupBuyProducts = useMemo(
    () => products.filter((product) => product.category === '공구상품'),
    [products]
  );
  const visibleProducts = useMemo(
    () => activeStatus === '전체'
      ? groupBuyProducts
      : groupBuyProducts.filter((product) => getStatus(product.badge) === activeStatus),
    [activeStatus, groupBuyProducts]
  );

  const showWholesalePrice = user.role === 'wholesale_approved' || user.role === 'admin';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>NINI LAND GROUP BUY</p>
          <h1>공구 · 배송일정</h1>
          <p>공구 상품의 현재 상태와 상품별 출고 안내를 확인하세요.</p>
        </div>

        <div className={styles.badgeList} role="group" aria-label="공구 상태 필터">
          {groupBuyStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={`${styles.badgeButton} ${activeStatus === status ? styles.activeBadge : ''}`}
              onClick={() => setActiveStatus(status)}
              aria-pressed={activeStatus === status}
            >
              {status}
            </button>
          ))}
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>{activeStatus === '전체' ? '공구 상품 전체' : `${activeStatus} 상품`}</h2>
            <span>{visibleProducts.length}개</span>
          </div>
          {visibleProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {visibleProducts.map((product) => (
                <article key={product.id} className={styles.productCard}>
                  <Link href={`/product/${product.slug}`} className={styles.productLink}>
                    <div className={styles.imageWrap}>
                      <Image
                        src={product.image || '/placeholder-product.svg'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 240px"
                        loading="eager"
                      />
                      <div className={styles.badge}>{getStatus(product.badge)}</div>
                    </div>
                    <div className={styles.cardContent}>
                      <span className={styles.productCode}>{product.productCode || 'NINI LAND'}</span>
                      <h3>{product.name}</h3>
                      {showWholesalePrice ? (
                        <>
                          <div className={styles.wholesalePrice}>
                            공급가 {product.wholesalePrice.toLocaleString()}원
                          </div>
                          <div className={styles.consumerPrice}>
                            권장판매가 {product.recommendedRetailPrice.toLocaleString()}원
                          </div>
                        </>
                      ) : (
                        <div className={styles.price}>
                          {product.consumerPrice.toLocaleString()}원
                        </div>
                      )}
                      <span className={styles.optionLink}>옵션 선택 · 주문 →</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyFilter}>
              <strong>{activeStatus} 상태의 상품이 없습니다.</strong>
              <button type="button" onClick={() => setActiveStatus('전체')}>전체 공구 보기</button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>공구 일정 안내</h2>
          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <span className={styles.label}>주문 진행</span>
              <span>상시 공구 · 재고 소진 시 마감</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>제작·검수</span>
              <span>공구 마감 후 약 7~10일</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>배송 안내</span>
              <span>상품 상세의 출고 안내 우선</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>배송 지연 안내</h2>
          <div className={styles.delayNotice}>
            <strong>현재 별도 공지된 배송 지연 상품이 없습니다.</strong>
            <p>제작 상품은 주문량에 따라 일정이 달라질 수 있으며 변동 시 공지사항과 주문 내역으로 안내합니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
