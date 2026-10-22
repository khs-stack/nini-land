'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMockStore } from '../lib/mockStore';

export default function OrdersPage() {
  const { orders, user } = useMockStore();
  const myOrders = useMemo(() => orders.filter((order) => order.userId === user.id), [orders, user.id]);

  if (user.role === 'guest') {
    return (
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 18 }}>
        <section style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 14px 30px rgba(17,17,17,0.06)' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>주문 내역</h1>
          <p style={{ color: '#666', fontSize: 15, marginBottom: 16 }}>로그인하면 회원 주문 내역을 볼 수 있습니다. 비회원으로 주문했다면 주문번호와 연락처로 조회해주세요.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/auth/login" style={{ color: '#2f6fed', fontWeight: 700 }}>로그인</Link>
            <Link href="/orders/lookup" style={{ color: '#2f6fed', fontWeight: 700 }}>비회원 주문조회</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 18 }}>
      <section style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 14px 30px rgba(17,17,17,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 24 }}>주문 내역</h1>
          <Link href="/cart" style={{ color: '#2f6fed', fontSize: 15, fontWeight: 700 }}>장바구니로</Link>
        </div>
        {myOrders.length === 0 ? (
          <p style={{ color: '#666', fontSize: 16 }}>아직 주문 내역이 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {myOrders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 16 }}>{order.id}</strong>
                  <span style={{ fontSize: 14, color: '#666' }}>{order.createdAt}</span>
                </div>
                <div style={{ color: '#666', fontSize: 15, marginBottom: 8 }}>수령인: {order.recipient}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>총액 {order.total.toLocaleString()}원</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <Link href={`/orders/${order.id}`} style={{ color: '#2f6fed', fontWeight: 700, fontSize: 15 }}>주문 상세 보기</Link>
                  <Link href="/shipping" style={{ color: '#2f6fed', fontWeight: 700, fontSize: 15 }}>배송 조회</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
