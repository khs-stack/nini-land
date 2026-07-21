'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMockStore } from "./lib/mockStore";
import { initialSettings } from "./lib/mockSettings";
import { ProductCard } from "./components/ProductCard";
import { HeroBanner } from "./components/HeroBanner";
import styles from "./page.module.css";

export default function Home() {
  const { products, popups } = useMockStore();
  const settings = initialSettings;
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activePopups = useMemo(() => {
    const now = Date.now();
    return popups.filter(
      (p) => p.visible && new Date(p.startDate).getTime() <= now && new Date(p.endDate).getTime() >= now && !dismissed.includes(p.id)
    );
  }, [popups, dismissed]);

  const newProducts = useMemo(() => products.filter((p) => p.category === '신상품'), [products]);
  const bestProducts = useMemo(() => products.filter((p) => p.category === '베스트'), [products]);
  const groupbuyProducts = useMemo(() => products.filter((p) => p.category === '공구상품'), [products]);
  const otherProducts = useMemo(
    () => products.filter((p) => !['신상품', '베스트', '공구상품'].includes(p.category)),
    [products]
  );

  const slides = useMemo(() => [
    {
      eyebrow: 'NiNi Land',
      title: settings.heroTitle,
      description: settings.heroDescription,
      href: '/search',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fff 100%)',
    },
    {
      eyebrow: 'BEST',
      title: settings.heroBadge,
      description: '가장 많이 찾는 니니랜드 베스트 아이템을 만나보세요.',
      href: '/category/베스트',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #fff 100%)',
    },
    {
      eyebrow: 'GROUP BUY',
      title: '공구 기간 한정 특가',
      description: '이번 공구 기간에만 만날 수 있는 특별한 가격입니다.',
      href: '/groupbuy',
      background: 'linear-gradient(135deg, #fde2e2 0%, #fff 100%)',
    },
  ], [settings]);

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

      <HeroBanner slides={slides} />

      <section className={styles.quickLinks}>
        <Link href="/category/신상품" className={styles.quickLinkItem}><span>🆕</span>신상품</Link>
        <Link href="/category/베스트" className={styles.quickLinkItem}><span>🔥</span>베스트</Link>
        <Link href="/groupbuy" className={styles.quickLinkItem}><span>⏰</span>공구</Link>
        <Link href="/search" className={styles.quickLinkItem}><span>🔍</span>전체상품</Link>
      </section>

      {newProducts.length > 0 && (
        <>
          <section className={styles.sectionHeader}>
            <h2>신상품</h2>
            <span>새로 들어온 아이템</span>
          </section>
          <section className={styles.productList}>
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        </>
      )}

      {bestProducts.length > 0 && (
        <>
          <section className={styles.sectionHeader}>
            <h2>베스트</h2>
            <span>가장 많이 찾는 아이템</span>
          </section>
          <section className={styles.productList}>
            {bestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        </>
      )}

      {groupbuyProducts.length > 0 && (
        <>
          <section className={styles.sectionHeader}>
            <h2>공구상품</h2>
            <span>기간 한정 특가</span>
          </section>
          <section className={styles.productList}>
            {groupbuyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        </>
      )}

      {otherProducts.length > 0 && (
        <>
          <section className={styles.sectionHeader}>
            <h2>전체 상품</h2>
          </section>
          <section className={styles.productList}>
            {otherProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
