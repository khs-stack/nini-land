'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { useMockStore } from './lib/mockStore';
import { isStoreOpen, WHOLESALE_ENABLED } from './lib/mockSettings';
import { isGroupbuyClosed } from './lib/mockProducts';
import styles from './page.module.css';

type HeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  background: string;
  image?: string;
  imagePosition?: string;
  theme?: 'light' | 'dark';
};

const PAGE_LOADED_AT = Date.now();

export default function Home() {
  const { products, popups, isWholesaleApproved, settings, catalogLoaded } = useMockStore();
  const open = isStoreOpen(settings);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activePopups = useMemo(() => {
    const now = PAGE_LOADED_AT;
    return popups.filter(
      (popup) =>
        popup.visible &&
        new Date(popup.startDate).getTime() <= now &&
        new Date(popup.endDate).getTime() >= now &&
        !dismissed.includes(popup.id)
    );
  }, [popups, dismissed]);

  const newProducts = useMemo(() => products.filter((product) => product.category === '신상품'), [products]);
  const bestProducts = useMemo(() => products.filter((product) => product.category === '베스트'), [products]);
  const groupbuyProducts = useMemo(
    () => products.filter((product) => (product.category === '공구상품' || product.groupbuyEndsAt) && !isGroupbuyClosed(product)),
    [products]
  );

  const slides = useMemo<HeroSlide[]>(
    () => [
      {
        eyebrow: 'SUMMER BEST · 4 COLOR',
        title: '컬러별로 고르는\n룩앤미세트',
        description: '노랑·핑크·오렌지·블루 네 가지 컬러를 실제 착용 사진으로 확인하고 골라보세요.',
        href: '/product/look-and-me-set',
        background: '#f2c82e',
        image: '/products/2026-collection/smile-group-01.webp',
        imagePosition: 'center 42%',
        theme: 'light',
      },
      {
        eyebrow: '2025 SEASON LIMITED',
        title: '어쩔김장룩\n상하·보넷 세트',
        description: '레드·네이비·블랙 세 가지 컬러로 준비한 시즌 한정 김장룩입니다.',
        href: '/product/2025-eojjeol-kimjang-set',
        background: '#3e3029',
        image: '/products/2026-collection/kimjang-flower-outdoor.webp',
        imagePosition: 'center 46%',
        theme: 'dark',
      },
      {
        eyebrow: 'DAILY HOMEWEAR',
        title: '매일 손이 가는\n레고실내복',
        description: '브릭·머스타드·핑크·올리브 컬러와 3호부터 11호까지의 사이즈를 한눈에 확인하세요.',
        href: '/product/lego-homewear',
        background: '#d8c4b2',
        image: '/products/2026-collection/block-homewear-models.webp',
        imagePosition: 'center 44%',
        theme: 'light',
      },
    ],
    []
  );

  return (
    <main className={styles.page}>
      {activePopups.map((popup) => (
        <aside key={popup.id} className={styles.noticeBar} aria-label={popup.title}>
          <div>
            <strong>{popup.title}</strong>
            <span>{popup.content}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissed((current) => [...current, popup.id])}
            aria-label={`${popup.title} 닫기`}
          >
            닫기
          </button>
        </aside>
      ))}

      {catalogLoaded && !open && (
        <aside className={styles.noticeBar} aria-label="오픈 안내">
          <div>
            <strong>오픈 준비중</strong>
            <span>곧 첫 공구를 시작합니다. 지금은 상품 구경만 가능해요.</span>
          </div>
        </aside>
      )}

      <HeroBanner slides={slides} />

      {!WHOLESALE_ENABLED && (
        <section className={styles.wholesaleIntro}>
          <div className={styles.wholesaleCopy}>
            <span className={styles.wholesaleEyebrow}>HOW GROUP BUY WORKS</span>
            <h2>{settings.heroTitle}</h2>
            <p>{settings.heroDescription}</p>
          </div>
          <div className={styles.wholesaleBenefits}>
            <span><b>01</b> 공구 기간 안에 주문·입금</span>
            <span><b>02</b> 마감 후 도매처에 한 번에 주문</span>
            <span><b>03</b> 입고되는 대로 순차 발송</span>
          </div>
          <Link href="/groupbuy" className={styles.wholesaleButton}>
            진행중인 공구 보기
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      {WHOLESALE_ENABLED && (
      <section className={styles.wholesaleIntro}>
        <div className={styles.wholesaleCopy}>
          <span className={styles.wholesaleEyebrow}>KIDS WHOLESALE</span>
          <h2>니니랜드 유아·아동복 도매 주문</h2>
          <p>
            일반 고객에게는 판매가만 안내하고, 승인된 사업자 회원에게는 공급가·권장 판매가·최소주문수량을 구분해 안내합니다.
          </p>
        </div>
        <div className={styles.wholesaleBenefits}>
          <span><b>01</b> 사업자 승인 후 공급가 공개</span>
          <span><b>02</b> 상품별 2~3장부터 혼합 주문</span>
          <span><b>03</b> 실제 착용·컬러 사진으로 주문 확인</span>
        </div>
        <Link href={isWholesaleApproved ? '/category/신상품' : '/auth/signup-wholesale'} className={styles.wholesaleButton}>
          {isWholesaleApproved ? '도매 상품 보기' : '사업자 회원 신청'}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      )}

      <nav className={styles.quickLinks} aria-label="상품 바로가기">
        <Link href="/category/신상품" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>NEW</span>
          <b>신상품</b>
          <small>이번 시즌 첫 공개</small>
        </Link>
        <Link href="/category/베스트" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>BEST</span>
          <b>베스트</b>
          <small>주문이 많은 상품</small>
        </Link>
        <Link href="/groupbuy" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>GROUP</span>
          <b>공구상품</b>
          <small>기간 한정 주문</small>
        </Link>
        <Link href="/search" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>ALL</span>
          <b>전체상품</b>
          <small>한눈에 둘러보기</small>
        </Link>
      </nav>

      <ProductSection
        title="진행중인 공구"
        subtitle="마감 전에 주문·입금해주세요"
        href="/groupbuy"
        products={groupbuyProducts}
      />
      <ProductSection
        title="신상품"
        subtitle="새로 들어온 상품"
        href="/category/신상품"
        products={newProducts}
      />
      <ProductSection
        title="베스트"
        subtitle="주문이 많은 인기 상품"
        href="/category/베스트"
        products={bestProducts}
      />
      <ProductSection title="전체 상품" subtitle="니니랜드의 모든 상품" href="/search" products={products} />
    </main>
  );
}

function ProductSection({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle: string;
  href: string;
  products: ReturnType<typeof useMockStore>['products'];
}) {
  if (products.length === 0) return null;

  return (
    <section className={styles.productSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p>{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <Link href={href}>전체보기 <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.productList}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
