'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMockStore } from '../lib/mockStore';
import { REVIEW_LABEL } from '../lib/account';
import { EmptyState } from '../components/EmptyState';
import styles from '../admin/admin-layout.module.css';

const navItems = [
  { href: '/vendor', label: '내 상품' },
  { href: '/vendor/new', label: '상품 올리기' },
  { href: '/vendor/orders', label: '주문 · 발송' },
  { href: '/vendor/settlement', label: '정산' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account, authChecked } = useMockStore();

  if (!authChecked) return <main style={{ padding: 24, color: '#888' }}>로그인 확인 중…</main>;

  if (!account) {
    return (
      <main style={{ padding: 24 }}>
        <EmptyState icon="🏬" title="입점 도매처 전용 화면입니다" description="도매처 계정으로 로그인하거나 입점 신청을 해주세요." actionLabel="로그인" actionHref="/auth/login?next=/vendor" />
      </main>
    );
  }

  if (!account.vendor) {
    return (
      <main style={{ padding: 24 }}>
        <EmptyState icon="🏬" title="입점 도매처로 가입하지 않은 계정입니다" description="니니랜드에 상품을 팔려면 입점 도매처로 가입해주세요." actionLabel="입점 신청" actionHref="/auth/business" />
      </main>
    );
  }

  if (account.vendor.status !== 'approved') {
    return (
      <main style={{ padding: 24 }}>
        <EmptyState
          icon={account.vendor.status === 'pending' ? '⏳' : '⛔'}
          title={`입점 ${REVIEW_LABEL[account.vendor.status]}`}
          description={account.vendor.status === 'pending'
            ? (account.vendor.hasCert ? '니니랜드가 사업자등록증을 확인하고 있습니다. 승인되면 상품을 올릴 수 있어요.' : '마이페이지에서 사업자등록증을 올려주세요.')
            : (account.vendor.reviewNote || '자세한 내용은 니니랜드에 문의해주세요.')}
          actionLabel="마이페이지"
          actionHref="/mypage"
        />
      </main>
    );
  }

  const isActive = (href: string) => (href === '/vendor' ? pathname === '/vendor' : pathname?.startsWith(href));

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>{account.vendor.companyName}</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}>{item.label}</Link>
          ))}
        </nav>
      </aside>
      <div className={styles.tabsRow}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`${styles.tabItem} ${isActive(item.href) ? styles.tabItemActive : ''}`}>{item.label}</Link>
        ))}
      </div>
      <div className={styles.content} style={{ padding: '12px 16px' }}>{children}</div>
    </div>
  );
}
