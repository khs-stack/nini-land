'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { useMockStore } from './lib/mockStore';
import { isStoreOpen } from './lib/mockSettings';
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

const PAGE_LOADED_AT = Date.now();
const HERO_COLORS = ['#1f3b73', '#c8372d', '#f2b632'];

export default function Home() {
  const { products, popups, isWholesaleApproved, settings, catalogLoaded, user } = useMockStore();
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

  // 일반 고객에게 파는 상품 (로봇 등)
  const consumerProducts = useMemo(() => products.filter((p) => (p.consumerMode ?? 'retail') !== 'none'), [products]);
  const preorderProducts = useMemo(() => consumerProducts.filter((p) => p.consumerMode === 'groupbuy' && !isGroupbuyClosed(p)), [consumerProducts]);
  const regularProducts = useMemo(() => consumerProducts.filter((p) => p.consumerMode !== 'groupbuy'), [consumerProducts]);
  // 사업자 도매관: 도매가를 볼 수 있는 사람에게만
  const wholesaleProducts = useMemo(() => products.filter((p) => p.wholesaleAvailable), [products]);
  const hasWholesaleItems = products.some((p) => p.wholesaleEnabled);

  // 히어로: 한정 예약 → 상시 판매 순으로 최대 3개. 상품이 없으면 브랜드 소개 한 장.
  const slides = useMemo<HeroSlide[]>(() => {
    const picks: Product[] = [...preorderProducts, ...regularProducts].slice(0, 3);
    if (!picks.length) {
      return [{
        eyebrow: settings.heroBadge || 'NINI LAND ORIGINAL',
        title: settings.heroTitle || '니니랜드 변신로봇',
        description: settings.heroDescription,
        href: '/search',
        background: HERO_COLORS[0],
        theme: 'dark',
      }];
    }
    return picks.map((p, index) => ({
      eyebrow: p.consumerMode === 'groupbuy' ? '한정 예약 판매' : p.badge || 'NINI LAND ORIGINAL',
      title: p.name,
      description: p.description,
      href: `/product/${p.slug}`,
      background: HERO_COLORS[index % HERO_COLORS.length],
      image: p.image,
      imagePosition: 'center',
      theme: index === 2 ? 'light' : 'dark',
    }));
  }, [preorderProducts, regularProducts, settings.heroBadge, settings.heroTitle, settings.heroDescription]);

  return (
    <main className={styles.page}>
      {activePopups.map((popup) => (
        <aside key={popup.id} className={styles.noticeBar} aria-label={popup.title}>
          <div>
            <strong>{popup.title}</strong>
            <span>{popup.content}</span>
          </div>
          <button type="button" onClick={() => setDismissed((current) => [...current, popup.id])} aria-label={`${popup.title} 닫기`}>
            닫기
          </button>
        </aside>
      ))}

      {catalogLoaded && !open && (
        <aside className={styles.noticeBar} aria-label="오픈 안내">
          <div>
            <strong>오픈 준비중</strong>
            <span>곧 판매를 시작합니다. 지금은 상품 구경만 가능해요.</span>
          </div>
        </aside>
      )}

      <HeroBanner slides={slides} />

      <section className={styles.wholesaleIntro}>
        <div className={styles.wholesaleCopy}>
          <span className={styles.wholesaleEyebrow}>NINI LAND ORIGINAL</span>
          <h2>{settings.heroTitle}</h2>
          <p>{settings.heroDescription}</p>
        </div>
        <div className={styles.wholesaleBenefits}>
          <span><b>상시</b> 언제든 주문, 입금 확인 후 바로 발송</span>
          <span><b>예약</b> 새 모델은 기간 한정 예약 후 입고 순 발송</span>
          <span><b>KC</b> 어린이제품 안전확인 후 판매</span>
        </div>
        <Link href={preorderProducts.length ? '/groupbuy' : '/search'} className={styles.wholesaleButton}>
          {preorderProducts.length ? '한정 예약 보기' : '전체 상품 보기'}
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <nav className={styles.quickLinks} aria-label="상품 바로가기">
        <Link href="/category/변신로봇" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>ROBOT</span>
          <b>변신로봇</b>
          <small>니니랜드 오리지널</small>
        </Link>
        <Link href="/groupbuy" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>PRE</span>
          <b>한정 예약</b>
          <small>기간 한정 주문</small>
        </Link>
        <Link href="/category/신상품" className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>NEW</span>
          <b>신상품</b>
          <small>새로 나온 모델</small>
        </Link>
        <Link href={isWholesaleApproved ? '#wholesale' : '/auth/business'} className={styles.quickLinkItem}>
          <span className={styles.quickIcon}>B2B</span>
          <b>사업자 도매</b>
          <small>가게 사장님 전용</small>
        </Link>
      </nav>

      <ProductSection title="한정 예약 판매" subtitle="마감 전에 주문·입금해주세요" href="/groupbuy" products={preorderProducts} />
      <ProductSection title="니니랜드 상품" subtitle="언제든 주문할 수 있어요" href="/search" products={regularProducts} />

      {catalogLoaded && consumerProducts.length === 0 && (
        <section className={styles.productSection}>
          <p style={{ color: '#888', textAlign: 'center', padding: '24px 0' }}>첫 변신로봇을 준비하고 있어요. 곧 공개합니다.</p>
        </section>
      )}

      <div id="wholesale">
        {wholesaleProducts.length > 0 ? (
          <ProductSection title="사업자 도매관" subtitle="승인된 사업자 회원에게만 보이는 도매 상품" href="/search" products={wholesaleProducts} />
        ) : hasWholesaleItems && (
          <section className={styles.wholesaleIntro}>
            <div className={styles.wholesaleCopy}>
              <span className={styles.wholesaleEyebrow}>FOR BUSINESS</span>
              <h2>가게 사장님은 도매가로</h2>
              <p>장난감 가게·매장 사장님은 사업자 회원으로 가입하면 니니랜드 로봇과 아동복을 도매가로 살 수 있어요. 사업자등록증 확인 후 승인됩니다.</p>
            </div>
            <Link href={user.role === 'guest' ? '/auth/business' : '/mypage'} className={styles.wholesaleButton}>
              {user.role === 'guest' ? '사업자 회원 가입' : '내 가입 상태 보기'}
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
      </div>
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
          <p>{subtitle}</p>
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
