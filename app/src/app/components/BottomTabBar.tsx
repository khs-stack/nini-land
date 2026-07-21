'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMockStore } from '../lib/mockStore';

const tabs = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/search', label: '카테고리', icon: '🗂️' },
  { href: '/cart', label: '장바구니', icon: '🛒' },
  { href: '/mypage', label: '마이', icon: '👤' },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { cartItems } = useMockStore();

  return (
    <nav className="bottomTabBar">
      {tabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bottomTabBarItem${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottomTabBarIcon">
              {tab.icon}
              {tab.href === '/cart' && cartItems.length > 0 && (
                <span style={{
                  position: 'absolute',
                  marginLeft: 2,
                  fontSize: 10,
                  background: '#ff6b6b',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '0 5px',
                  verticalAlign: 'top',
                }}>
                  {cartItems.length}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
