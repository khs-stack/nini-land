'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMockStore } from '../lib/mockStore';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, createOrder, user } = useMockStore();
  const [recipient, setRecipient] = useState('홍길동');
  const [shippingFee, setShippingFee] = useState(3000);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cartItems]);

  const handleOrder = () => {
    const order = createOrder(recipient, shippingFee);
    if (order) {
      setOrderComplete(order.id);
    }
  };

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 24 }}>장바구니</h1>
          <Link href="/" style={{ color: '#2f6fed' }}>쇼핑 계속하기</Link>
        </div>

        {cartItems.length === 0 ? (
          <p style={{ color: '#666' }}>장바구니가 비어 있습니다.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {cartItems.map((item) => (
              <div key={item.productId} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{item.priceType === 'wholesale' ? '도매가' : '소비자가'} · {item.unitPrice.toLocaleString()}원</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={1} value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value))} style={{ width: 70, border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px' }} />
                  <button type="button" onClick={() => removeFromCart(item.productId)} style={{ border: 0, background: '#111', color: 'white', borderRadius: 8, padding: '8px 10px' }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>주문서</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="수령인" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <input type="number" value={shippingFee} onChange={(event) => setShippingFee(Number(event.target.value))} placeholder="배송비" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <div style={{ color: '#666' }}>현재 역할: {user.role}</div>
          <div style={{ fontWeight: 700 }}>총 결제 금액: {(subtotal + shippingFee).toLocaleString()}원</div>
          <button type="button" onClick={handleOrder} style={{ border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: 'white' }}>주문하기</button>
          {orderComplete ? <p style={{ color: '#0f7a4f' }}>주문이 완료되었습니다. 주문번호: {orderComplete}</p> : null}
        </div>
      </section>
    </main>
  );
}
