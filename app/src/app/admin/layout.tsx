'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';
import styles from './admin-layout.module.css';

const navItems = [
  { href: '/admin/dashboard', label: '대시보드', icon: '📊' },
  { href: '/admin/products', label: '상품 관리', icon: '📦' },
  { href: '/admin/orders', label: '주문 · 배송', icon: '🚚' },
  { href: '/admin/returns', label: '취소 · 교환 · 반품', icon: '↩️' },
  { href: '/admin/members', label: '회원 관리', icon: '👥' },
  { href: '/admin/announcements', label: '공지사항', icon: '📢' },
  { href: '/admin/popup', label: '팝업 관리', icon: '🪧' },
  { href: '/admin/settings', label: '홈 화면 설정', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useMockStore();

  if (!isAdmin) {
    return (
      <main style={{ padding: 24 }}>
        <EmptyState icon="🔐" title="접근 권한이 없습니다" description="관리자 계정으로 로그인해주세요." actionLabel="홈으로" actionHref="/" />
      </main>
    );
  }

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>관리자</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className={styles.tabsRow}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.tabItem} ${pathname === item.href ? styles.tabItemActive : ''}`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
