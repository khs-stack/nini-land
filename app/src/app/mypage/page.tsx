'use client';

import Link from 'next/link';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';
import styles from './mypage.module.css';

export default function MyPage() {
  const { user, cartItems, orders } = useMockStore();

  if (user.role === 'guest') {
    return (
      <main className={styles.page}>
        <EmptyState
          icon="🔐"
          title="로그인이 필요합니다"
          description="마이페이지를 이용하려면 로그인해주세요."
          actionLabel="로그인하기"
          actionHref="/auth/login"
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>마이페이지</h1>
          <div className={styles.userInfo}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.role}>
              {user.role === 'admin' ? '관리자' : user.role === 'wholesale_approved' ? '도매회원' : user.role === 'wholesale_pending' ? '사업자(승인대기)' : '일반회원'}
            </span>
          </div>
        </div>

        <div className={styles.gridContainer}>
          <section className={styles.section}>
            <h2>주문내역</h2>
            <div className={styles.stat}>
              <span className={styles.number}>{orders.length}</span>
              <span>건</span>
            </div>
            <Link href="/orders" className={styles.link}>조회하기 →</Link>
          </section>

          <section className={styles.section}>
            <h2>장바구니</h2>
            <div className={styles.stat}>
              <span className={styles.number}>{cartItems.length}</span>
              <span>개</span>
            </div>
            <Link href="/cart" className={styles.link}>확인하기 →</Link>
          </section>

          <section className={styles.section}>
            <h2>관심상품</h2>
            <div className={styles.stat}>
              <span className={styles.number}>0</span>
              <span>개</span>
            </div>
            <Link href="/wishlist" className={styles.link}>조회하기 →</Link>
          </section>

          <section className={styles.section}>
            <h2>최근본상품</h2>
            <div className={styles.stat}>
              <span className={styles.number}>0</span>
              <span>개</span>
            </div>
            <Link href="/recently-viewed" className={styles.link}>조회하기 →</Link>
          </section>
        </div>

        <div className={styles.menu}>
          <Link href="/mypage/info">회원정보 수정</Link>
          <Link href="/mypage/addresses">배송지 관리</Link>
          {user.role.includes('wholesale') && (
            <Link href="/mypage/wholesale-info">사업자정보 관리</Link>
          )}
          {user.role === 'admin' && (
            <>
              <Link href="/admin/dashboard">관리자 대시보드</Link>
              <Link href="/admin/products">상품 관리</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
