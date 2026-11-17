'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { HeroBanner } from './components/HeroBanner';
import { PopupLayer } from './components/PopupLayer';
import { ProductCard } from './components/ProductCard';
import { useMockStore } from './lib/mockStore';
import { isStoreOpen, normalizeHomeSections, type HomeSection } from './lib/mockSettings';
import { isGroupbuyClosed, isListed, type Product } from './lib/mockProducts';
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

const HERO_COLORS = ['#1f3b73', '#c8372d', '#f2b632'];

export default function Home() {
  const { products, popups, settings, catalogLoaded, user } = useMockStore();
  const open = isStoreOpen(settings);
  const sections = normalizeHomeSections(settings.homeSections);

  // 일반 고객(+지인)에게 파는 상품. 숨긴 분류(변신로봇인형)는 빼고
  const consumerProducts = useMemo(() => products.filter((p) => isListed(p) && ((p.consumerMode ?? 'retail') !== 'none' || p.friendAvailable)), [products]);
  const preorderProducts = useMemo(() => consumerProducts.filter((p) => p.consumerMode === 'groupbuy' && !isGroupbuyClosed(p)), [consumerProducts]);
  const regularProducts = useMemo(() => consumerProducts.filter((p) => p.consumerMode !== 'groupbuy'), [consumerProducts]);
  // 사업자 도매관: 도매가를 볼 수 있는 사람에게만
  const wholesaleProducts = useMemo(() => products.filter((p) => isListed(p) && p.wholesaleAvailable), [products]);
  const hasWholesaleItems = products.some((p) => p.wholesaleEnabled);

  // 큰 배너: 한정 예약 → 상시 판매 순으로 최대 3개. 상품이 없으면 브랜드 소개 한 장.
  const slides = useMemo<HeroSlide[]>(() => {
    const picks: Product[] = [...preorderProducts, ...regularProducts].slice(0, 3);
    if (!picks.length) {
      return [{
        eyebrow: settings.heroBadge || 'NINI LAND ORIGINAL',
        title: settings.heroTitle || '니니랜드 유아옷',
        description: settings.heroDescription,
        href: '/search',
        background: HERO_COLORS[0],
        theme: 'dark',
      }];
    }
    return picks.map((p, index) => ({
      eyebrow: p.consumerMode === 'groupbuy' ? '한정 예약 판매' : p.badge || settings.heroBadge || 'NINI LAND ORIGINAL',
      title: p.name,
      description: p.description,
      href: `/product/${p.slug}`,
      background: HERO_COLORS[index % HERO_COLORS.length],
      image: p.image,
      imagePosition: 'center',
      theme: index === 2 ? 'light' : 'dark',
    }));
  }, [preorderProducts, regularProducts, settings.heroBadge, settings.heroTitle, settings.heroDescription]);

  const renderSection = (section: HomeSection) => {
    if (!section.visible) return null;
    switch (section.key) {
      case 'hero':
        return <HeroBanner key="hero" slides={slides} />;
      case 'intro':
        return (
          <section key="intro" className={styles.wholesaleIntro}>
            <div className={styles.wholesaleCopy}>
              {settings.introEyebrow && <span className={styles.wholesaleEyebrow}>{settings.introEyebrow}</span>}
              <h2>{settings.heroTitle}</h2>
              <p>{settings.heroDescription}</p>
            </div>
            {settings.introBenefits.filter((b) => b.trim()).length > 0 && (
              <div className={styles.wholesaleBenefits}>
                {settings.introBenefits.filter((b) => b.trim()).map((b, i) => <span key={i}>{b}</span>)}
              </div>
            )}
            {settings.introButtonLabel && (
              <Link href={preorderProducts.length ? '/groupbuy' : '/search'} className={styles.wholesaleButton}>
                {settings.introButtonLabel}
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </section>
        );
      case 'quickLinks':
        if (!settings.quickLinks.length) return null;
        return (
          <nav key="quickLinks" className={styles.quickLinks} aria-label="바로가기">
            {settings.quickLinks.map((q, i) => (
              <Link key={i} href={q.href || '/search'} className={styles.quickLinkItem}>
                <span className={styles.quickIcon}>{q.icon}</span>
                <b>{q.label}</b>
                <small>{q.sub}</small>
              </Link>
            ))}
          </nav>
        );
      case 'preorder':
        return <ProductSection key="preorder" title={section.title || '한정 예약 판매'} subtitle={section.subtitle || ''} href="/groupbuy" products={preorderProducts} />;
      case 'regular':
        return (
          <div key="regular">
            <ProductSection title={section.title || '니니랜드 상품'} subtitle={section.subtitle || ''} href="/search" products={regularProducts} />
            {catalogLoaded && consumerProducts.length === 0 && (
              <section className={styles.productSection}>
                <p style={{ color: '#888', textAlign: 'center', padding: '24px 0' }}>{settings.emptyText}</p>
              </section>
            )}
          </div>
        );
      case 'wholesale':
        return (
          <div key="wholesale" id="wholesale">
            {wholesaleProducts.length > 0 ? (
              <ProductSection title={section.title || '사업자 도매관'} subtitle={section.subtitle || ''} href="/search" products={wholesaleProducts} />
            ) : hasWholesaleItems && (
              <section className={styles.wholesaleIntro}>
                <div className={styles.wholesaleCopy}>
                  <span className={styles.wholesaleEyebrow}>FOR BUSINESS</span>
                  <h2>가게 사장님은 도매가로</h2>
                  <p>매장 사장님은 사업자 회원으로 가입하면 도매가로 살 수 있어요. 사업자등록증 확인 후 승인됩니다.</p>
                </div>
                <Link href={user.role === 'guest' ? '/auth/business' : '/mypage'} className={styles.wholesaleButton}>
                  {user.role === 'guest' ? '사업자 회원 가입' : '내 가입 상태 보기'}
                  <span aria-hidden="true">→</span>
                </Link>
              </section>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className={styles.page}>
      <PopupLayer popups={popups} />

      {catalogLoaded && !open && (
        <aside className={styles.noticeBar} aria-label="오픈 안내">
          <div>
            <strong>오픈 준비중</strong>
            <span>곧 판매를 시작합니다. 지금은 상품 구경만 가능해요.</span>
          </div>
        </aside>
      )}

      {sections.map(renderSection)}
    </main>
  );
}

function ProductSection({ title, subtitle, href, products }: { title: string; subtitle: string; href: string; products: Product[] }) {
  const visible = products.filter(isListed);
  if (visible.length === 0) return null;
  return (
    <section className={styles.productSection}>
      <div className={styles.sectionHeader}>
        <div>
          {subtitle && <p>{subtitle}</p>}
          <h2>{title}</h2>
        </div>
        <Link href={href}>전체보기 <span aria-hidden="true">→</span></Link>
      </div>
      <div className={styles.productList}>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
