'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { loadSavedOrders, supabase } from '../lib/supabase';
import styles from './mypage.module.css';

export default function MyPage() {
  const { user, cartItems, orders, wishlist, recentlyViewed } = useMockStore();
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    // 회원가입 없이 주문하므로 이 기기에 저장된 주문 수를 보여준다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (supabase) setSavedCount(loadSavedOrders().length);
  }, []);
  const myOrderCount = supabase ? savedCount : orders.filter((order) => order.userId === user.id).length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>마이페이지</h1>
          <div className={styles.userInfo}>
            <span className={styles.name}>{user.role === 'guest' ? '회원가입 없이 주문할 수 있어요' : user.name}</span>
            {user.role !== 'guest' && (
              <span className={styles.role}>
                {user.role === 'admin' ? '관리자' : user.role === 'wholesale_approved' ? '도매회원' : user.role === 'wholesale_pending' ? '사업자(승인대기)' : '일반회원'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.gridContainer}>
          <section className={styles.section}>
            <h2>주문내역</h2>
            <div className={styles.stat}>
              <span className={styles.number}>{myOrderCount}</span>
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
              <span className={styles.number}>{wishlist.length}</span>
              <span>개</span>
            </div>
            <Link href="/wishlist" className={styles.link}>조회하기 →</Link>
          </section>

          <section className={styles.section}>
            <h2>최근본상품</h2>
            <div className={styles.stat}>
              <span className={styles.number}>{recentlyViewed.length}</span>
              <span>개</span>
            </div>
            <Link href="/recently-viewed" className={styles.link}>조회하기 →</Link>
          </section>
        </div>

        <div className={styles.menu}>
          <Link href="/orders/lookup">주문번호로 주문 조회</Link>
          {user.role !== 'guest' && <Link href="/mypage/info">회원정보 수정</Link>}
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
