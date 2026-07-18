'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useMockStore, type CancelExchangeReturnType } from '../../lib/mockStore';

const typeLabels: Record<CancelExchangeReturnType, string> = {
  cancel: '취소',
  exchange: '교환',
  return: '반품',
};

const statusLabels: Record<string, string> = {
  requested: '신청됨',
  approved: '승인됨',
  rejected: '거절됨',
  completed: '완료',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, cers, createCER } = useMockStore();
  const order = orders.find((item) => item.id === id);
  const [activeForm, setActiveForm] = useState<CancelExchangeReturnType | null>(null);
  const [reason, setReason] = useState('');

  if (!order) {
    return <main style={{ padding: 24 }}>주문 정보를 찾을 수 없습니다.</main>;
  }

  const orderCers = cers.filter((cer) => cer.orderId === order.id);
  const canRequest = order.status !== 'cancelled';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!activeForm || !reason.trim()) return;
    createCER(order.id, activeForm, reason.trim(), { recipient: order.recipient });
    setReason('');
    setActiveForm(null);
  };

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

      <section style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 14px 30px rgba(17,17,17,0.06)' }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>취소 · 교환 · 반품</h2>

        {orderCers.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {orderCers.map((cer) => (
              <div key={cer.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{typeLabels[cer.type]} 신청</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{cer.reason}</div>
                </div>
                <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: cer.status === 'completed' ? '#e6f6ee' : '#fff2d6', color: cer.status === 'completed' ? '#0f7a4f' : '#a26500' }}>
                  {statusLabels[cer.status]}
                </span>
              </div>
            ))}
          </div>
        )}

        {canRequest && (
          <>
            {!activeForm ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['cancel', 'exchange', 'return'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveForm(type)}
                    style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 16px', background: '#fff', fontSize: 14, fontWeight: 600 }}
                  >
                    {typeLabels[type]} 신청
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
                <div style={{ fontWeight: 700 }}>{typeLabels[activeForm]} 신청</div>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={`${typeLabels[activeForm]} 사유를 입력해주세요`}
                  style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 80 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ flex: 1, border: 0, borderRadius: 10, padding: '10px', background: '#111', color: 'white', fontWeight: 700 }}>
                    신청하기
                  </button>
                  <button type="button" onClick={() => setActiveForm(null)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 16px', background: '#fff' }}>
                    취소
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
