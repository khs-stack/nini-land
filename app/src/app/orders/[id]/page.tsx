'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMockStore } from '../../lib/mockStore';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { orders } = useMockStore();
  const order = orders.find((item) => item.id === id);

  if (!order) {
    return <main style={{ padding: 24 }}>주문 정보를 찾을 수 없습니다.</main>;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 14px 30px rgba(17,17,17,0.06)' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>주문 상세</h1>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 12 }}>주문 번호: {order.id}</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {order.items.map((item) => (
            <div key={item.productId} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.name}</div>
              <div style={{ fontSize: 15, color: '#666', marginTop: 4 }}>수량 {item.quantity}개 · {item.unitPrice.toLocaleString()}원</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 16, fontWeight: 700 }}>배송비 {order.shippingFee.toLocaleString()}원 · 총액 {order.total.toLocaleString()}원</div>
        <div style={{ marginTop: 10 }}>
          <Link href="/shipping" style={{ color: '#2f6fed', fontWeight: 700, fontSize: 15 }}>배송 조회</Link>
        </div>
      </section>
    </main>
  );
}
