'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useMockStore, type OrderSummary } from '../../lib/mockStore';

export default function OrderLookupPage() {
  const { orders } = useMockStore();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<OrderSummary | null | undefined>(undefined);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = orders.find((order) => order.id === orderId.trim() && order.phone === phone.trim());
    setResult(found ?? null);
  };

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>비회원 주문조회</h1>
        <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>주문 시 입력한 주문번호와 연락처로 배송 상태를 확인할 수 있습니다.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="주문번호 (예: order-1234567890)" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <button type="submit" style={{ border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: 'white', fontWeight: 700 }}>조회하기</button>
        </form>

        {result === null && (
          <p style={{ marginTop: 16, color: '#e5484d', fontSize: 14 }}>일치하는 주문 정보를 찾을 수 없습니다. 주문번호와 연락처를 다시 확인해주세요.</p>
        )}

        {result && (
          <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 700 }}>주문번호 {result.id}</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>수령인 {result.recipient} · 총 {result.total.toLocaleString()}원</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>주문일 {result.createdAt}</div>
            <Link href={`/orders/${result.id}`} style={{ display: 'inline-block', marginTop: 10, color: '#2f6fed', fontWeight: 700, fontSize: 14 }}>
              주문 상세 보기 →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
