'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { loadSavedOrders, supabase } from '../lib/supabase';
import { AccountPanel } from '../components/AccountPanel';
import styles from './mypage.module.css';

export default function MyPage() {
  const { user, cartItems, orders, wishlist, recentlyViewed, account, authChecked } = useMockStore();
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    const client = supabase;
    if (!client || !authChecked) return;
    if (account) {
      // 회원은 계정에 쌓인 주문 수
      void client.rpc('my_orders').then(({ data }) => setSavedCount(Array.isArray(data) ? data.length : 0));
    } else {
      // 비회원은 이 기기에 저장된 주문 수
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedCount(loadSavedOrders().length);
    }
  }, [account, authChecked]);
  const myOrderCount = supabase ? savedCount : orders.filter((order) => order.userId === user.id).length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>마이페이지</h1>
          <div className={styles.userInfo}>
            <span className={styles.name}>{user.role === 'guest' ? '비회원' : user.name}</span>
            {user.role !== 'guest' && (
              <span className={styles.role}>
                {user.role === 'admin' ? '관리자' : account?.vendor ? '입점 도매처' : user.role === 'wholesale_approved' ? '사업자회원' : user.role === 'wholesale_pending' ? '사업자(승인대기)' : '카카오 회원'}
              </span>
            )}
          </div>
        </div>

        {authChecked && <AccountPanel key={account ? 'in' : 'out'} />}

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
