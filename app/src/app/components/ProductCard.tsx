'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type Product } from '../lib/mockProducts';
import { useMockStore } from '../lib/mockStore';
import styles from './ProductCard.module.css';

export function ProductCard({ product }: { product: Product }) {
  const { user, addToCart, isWholesaleApproved, wishlist, toggleWishlist } = useMockStore();
  const liked = wishlist.includes(product.id);
  const discountRate = product.discountPrice && product.discountPrice < product.consumerPrice
    ? Math.round((1 - product.discountPrice / product.consumerPrice) * 100)
    : 0;

  return (
    <article className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.link}>
        <div className={styles.imageWrap}>
          <Image src={product.image} alt={product.name} width={320} height={240} />
          {discountRate > 0 && <span className={styles.discountBadge}>{discountRate}%</span>}
        </div>
        <div className={styles.content}>
          <div className={styles.top}>
            <span>{product.category}</span>
            <span className={styles.badge}>{product.badge}</span>
          </div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <div className={styles.priceRow}>
            <strong>{(product.discountPrice || product.consumerPrice).toLocaleString()}원</strong>
            <span>{isWholesaleApproved ? '도매가 확인 가능' : '도매가 확인'}</span>
          </div>
        </div>
      </Link>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.likeButton}
          onClick={() => toggleWishlist(product.id)}
          aria-label={liked ? '관심상품 해제' : '관심상품 추가'}
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <button type="button" className={styles.addButton} onClick={() => addToCart(product, user.role)}>
          장바구니 담기
        </button>
      </div>
    </article>
  );
}
