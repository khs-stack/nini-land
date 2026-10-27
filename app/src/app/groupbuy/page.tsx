'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { isGroupbuyClosed, salePrice, type Product } from '../lib/mockProducts';
import { WHOLESALE_ENABLED } from '../lib/mockSettings';
import { GroupbuyBadge } from '../components/GroupbuyStatus';
import styles from './groupbuy.module.css';

const groupBuyStatuses = ['전체', '진행중', '마감'] as const;
type GroupBuyStatus = (typeof groupBuyStatuses)[number];

function getStatus(product: Product): Exclude<GroupBuyStatus, '전체'> {
  return isGroupbuyClosed(product) ? '마감' : '진행중';
}

export default function GroupBuyPage() {
  const { products, user, groupbuyCounts, catalogLoaded } = useMockStore();
  const [activeStatus, setActiveStatus] = useState<GroupBuyStatus>('전체');

  const groupBuyProducts = useMemo(
    () => products.filter((product) => product.consumerMode === 'groupbuy' || (!product.consumerMode && (product.category === '공구상품' || Boolean(product.groupbuyEndsAt)))),
    [products]
  );
  const visibleProducts = useMemo(
    () => activeStatus === '전체'
      ? groupBuyProducts
      : groupBuyProducts.filter((product) => getStatus(product) === activeStatus),
    [activeStatus, groupBuyProducts]
  );

  const showWholesalePrice = WHOLESALE_ENABLED && (user.role === 'wholesale_approved' || user.role === 'admin');

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>NINI LAND GROUP BUY</p>
          <h1>공구 · 배송일정</h1>
          <p>마감 전에 주문·입금하면 마감 후 도매처에 한 번에 주문해 순차 발송합니다.</p>
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
                      <div className={styles.badge}>{getStatus(product)}</div>
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
                          {salePrice(product).toLocaleString()}원
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#6f6861' }}>
                        <GroupbuyBadge product={product} />
                        {(groupbuyCounts[product.id] ?? 0) > 0 && <span>{groupbuyCounts[product.id]}개 주문</span>}
                      </div>
                      <span className={styles.optionLink}>{getStatus(product) === '마감' ? '마감된 공구' : '옵션 선택 · 주문 →'}</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : !catalogLoaded ? (
            <p style={{ color: '#888' }}>상품을 불러오는 중…</p>
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
              <span>상품별 마감일까지 주문·입금</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>발주·입고</span>
              <span>마감 후 도매처에 일괄 주문, 입고 후 검수</span>
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
            <p>도매처 입고 일정에 따라 발송이 늦어질 수 있으며, 변동 시 주문하신 연락처로 안내합니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
