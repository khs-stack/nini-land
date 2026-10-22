'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { type Product } from '../lib/mockProducts';
import { useMockStore } from '../lib/mockStore';
import styles from './ProductCard.module.css';

export function ProductCard({ product }: { product: Product }) {
  const { isWholesaleApproved, wishlist, toggleWishlist } = useMockStore();
  const [imageFailed, setImageFailed] = useState(false);
  const liked = wishlist.includes(product.id);
  const discountRate = product.discountPrice && product.discountPrice < product.consumerPrice
    ? Math.round((1 - product.discountPrice / product.consumerPrice) * 100)
    : 0;

  return (
    <article className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.link}>
        <div className={styles.imageWrap}>
          <Image
            src={imageFailed ? '/placeholder-product.svg' : product.image}
            alt={product.name}
            fill
            sizes="(max-width: 719px) 50vw, (max-width: 1023px) 33vw, 280px"
            className={styles.image}
            loading="eager"
            onError={() => setImageFailed(true)}
          />
          {discountRate > 0 && <span className={styles.discountBadge}>{discountRate}%</span>}
          <span className={styles.categoryBadge}>{product.category}</span>
        </div>
        <div className={styles.content}>
          <div className={styles.top}>
            <span className={styles.productCode}>{product.productCode || 'NINI LAND'}</span>
            <span className={styles.badge}>{product.badge}</span>
          </div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <div className={styles.priceRow}>
            <strong>{(product.discountPrice || product.consumerPrice).toLocaleString()}원</strong>
            <span>{isWholesaleApproved ? '공급가 확인 가능' : '사업자 별도'}</span>
          </div>
        </div>
      </Link>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.likeButton}
          onClick={() => toggleWishlist(product.id)}
          aria-label={liked ? '관심상품 해제' : '관심상품 추가'}
          aria-pressed={liked}
        >
          {liked ? '♥' : '♡'}
        </button>
        <Link href={`/product/${product.slug}`} className={styles.addButton}>
          옵션 선택 · 주문
        </Link>
      </div>
    </article>
  );
}
