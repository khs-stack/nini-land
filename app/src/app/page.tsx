'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMockStore } from "./lib/mockStore";
import { initialSettings } from "./lib/mockSettings";
import styles from "./page.module.css";

export default function Home() {
  const { products, user, addToCart, isWholesaleApproved, popups } = useMockStore();
  const settings = initialSettings;
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activePopups = useMemo(() => {
    const now = Date.now();
    return popups.filter(
      (p) => p.visible && new Date(p.startDate).getTime() <= now && new Date(p.endDate).getTime() >= now && !dismissed.includes(p.id)
    );
  }, [popups, dismissed]);

  return (
    <main className={styles.page}>
      {activePopups.map((popup) => (
        <div key={popup.id} style={{ background: '#111', color: '#fff', borderRadius: 16, padding: '14px 18px', margin: '0 0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>{popup.title}</strong>
            <span style={{ fontSize: 13, color: '#ccc' }}>{popup.content}</span>
          </div>
          <button type="button" onClick={() => setDismissed((current) => [...current, popup.id])} style={{ border: 0, background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, flexShrink: 0 }}>
            닫기
          </button>
        </div>
      ))}

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>NiNi Land</p>
          <h1>{settings.heroTitle}</h1>
          <p className={styles.description}>
            {settings.heroDescription}
          </p>
        </div>
        <div className={styles.heroCard}>
          <p>오늘의 추천</p>
          <strong>{settings.heroBadge}</strong>
          <p className={styles.heroMeta}>현재 역할: {user.role}</p>
          <p className={styles.heroMeta}>{isWholesaleApproved ? '도매가가 열려 있습니다.' : '도매가는 승인된 회원만 확인 가능합니다.'}</p>
        </div>
      </section>

      <section className={styles.sectionHeader}>
        <h2>신상품</h2>
        <span>실제 쇼핑몰처럼 상품 카드형으로 구성</span>
      </section>

      <section className={styles.productList}>
        {products.map((product) => (
          <article key={product.id} className={styles.productCard}>
            <Link href={`/product/${product.slug}`} className={styles.productLink}>
              <div className={styles.imageWrap}>
                <Image src={product.image} alt={product.name} width={320} height={240} />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <span>{product.category}</span>
                  <span className={styles.badge}>{product.badge}</span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className={styles.priceRow}>
                  <strong>{product.consumerPrice.toLocaleString()}원</strong>
                  <span>{isWholesaleApproved ? '도매가 확인 가능' : '도매가 확인'}</span>
                </div>
              </div>
            </Link>
            <button type="button" className={styles.addButton} onClick={() => addToCart(product, user.role)}>
              장바구니 담기
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
