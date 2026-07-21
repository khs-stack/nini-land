'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMockStore } from '../lib/mockStore';
import styles from './StoreHeader.module.css';

const roleLabels: Record<string, string> = {
  guest: '비회원',
  member: '일반회원',
  wholesale_pending: '사업자 승인대기',
  wholesale_approved: '도매회원',
  admin: '관리자',
};

export function StoreHeader() {
  const router = useRouter();
  const { user, logout, setDemoRole, isAdmin, cartItems } = useMockStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const cartBadgeCount = cartItems.length;

  return (
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <Link href="/" className={styles.brand}>NiNi Land</Link>
        
        <div className={styles.actions}>
          <form onSubmit={handleSearch} className={styles.searchForm} role="search">
            <label htmlFor="site-search" className="visually-hidden">상품 검색</label>
            <input
              id="site-search"
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </form>
          
          <Link href="/cart" className={styles.cartLink} aria-label={`장바구니${cartBadgeCount > 0 ? `, 담긴 상품 ${cartBadgeCount}개` : ''}`}>
            <span className={styles.cartIcon} aria-hidden="true">🛒</span>
            {cartBadgeCount > 0 && <span className={styles.badge}>{cartBadgeCount}</span>}
          </Link>
          
          {user.role === 'guest' ? (
            <Link href="/auth/login" className={styles.link}>로그인</Link>
          ) : (
            <>
              <Link href="/mypage" className={styles.link}>마이</Link>
              <button type="button" className={styles.button} onClick={logout}>
                로그아웃
              </button>
            </>
          )}
          
          {isAdmin && <Link href="/admin/dashboard" className={styles.link}>관리</Link>}
          
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? '개발자 메뉴 닫기' : '개발자 메뉴 열기'}
            aria-expanded={menuOpen}
          >
            ☰
          </button>
        </div>
      </div>

      <div className={styles.demoRow}>
        <span className={styles.userBadge}>{user.name || '게스트'} · {roleLabels[user.role] ?? user.role}</span>
        {menuOpen && (
          <div className={styles.roleSwitches}>
            {(['guest','member','wholesale_pending','wholesale_approved','admin'] as const).map((role) => (
              <button
                key={role}
                type="button"
                className={`${styles.roleButton} ${user.role === role ? styles.active : ''}`}
                onClick={() => {
                  setDemoRole(role);
                  setMenuOpen(false);
                }}
              >
                {roleLabels[role]}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
