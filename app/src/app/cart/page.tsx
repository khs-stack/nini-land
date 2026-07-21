'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';
import styles from './Cart.module.css';

const COUPON = { code: 'NINI5000', discount: 5000, label: '5,000원 할인 쿠폰' };

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, createOrder, user } = useMockStore();
  const [recipient, setRecipient] = useState('홍길동');
  const [phone, setPhone] = useState('010-1234-5678');
  const [address, setAddress] = useState('서울시 강남구 테헤란로 123');
  const [memo, setMemo] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [pointsAvailable] = useState(3000);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cartItems]);
  const shippingFee = subtotal >= 50000 || subtotal === 0 ? 0 : 3000;
  const couponDiscount = couponApplied ? COUPON.discount : 0;
  const total = Math.max(0, subtotal + shippingFee - couponDiscount - pointsUsed);

  const handleOrder = () => {
    const order = createOrder(recipient, shippingFee, phone);
    if (order) {
      setOrderComplete(order.id);
    }
  };

  if (cartItems.length === 0 && !orderComplete) {
    return (
      <main className={styles.emptyPage}>
        <EmptyState icon="🛒" title="장바구니가 비어 있습니다" description="마음에 드는 상품을 담아보세요." actionLabel="쇼핑하러 가기" actionHref="/" />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>장바구니 ({cartItems.length})</h1>
          <Link href="/" className={styles.continueLink}>쇼핑 계속하기</Link>
        </div>

        <div className={styles.itemList}>
          {cartItems.map((item) => (
            <div key={item.cartKey} className={styles.item}>
              <img src={item.image} alt={item.name} className={styles.itemImage} />
              <div className={styles.itemBody}>
                <div className={styles.itemName}>{item.name}</div>
                {(item.color || item.size) && (
                  <div className={styles.itemOption}>
                    {item.color}{item.color && item.size ? ' / ' : ''}{item.size}
                  </div>
                )}
                <div className={styles.itemPriceType}>{item.priceType === 'wholesale' ? '도매가' : '소비자가'} · {item.unitPrice.toLocaleString()}원</div>
                <div className={styles.itemControls}>
                  <div className={styles.stepper}>
                    <button type="button" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className={styles.stepperBtn}>−</button>
                    <span className={styles.stepperValue}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className={styles.stepperBtn}>+</button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.cartKey)} className={styles.removeBtn}>삭제</button>
                  <div className={styles.itemTotal}>{(item.unitPrice * item.quantity).toLocaleString()}원</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>배송 정보</h2>
        <div className={styles.formGrid}>
          <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="수령인" className={styles.input} />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="연락처 (비회원 주문조회 시 필요)" className={styles.input} />
          <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="배송지 주소" className={styles.input} />
          <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="배송 메모 (선택)" className={styles.input} />
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>쿠폰 · 포인트</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <label className={styles.couponRow}>
            <span>{COUPON.label}</span>
            <input type="checkbox" checked={couponApplied} onChange={(e) => setCouponApplied(e.target.checked)} />
          </label>
          <div className={styles.pointsRow}>
            <span className={styles.pointsLabel}>포인트 (보유 {pointsAvailable.toLocaleString()}P)</span>
            <input
              type="number"
              min={0}
              max={Math.min(pointsAvailable, subtotal)}
              value={pointsUsed}
              onChange={(e) => setPointsUsed(Math.max(0, Math.min(Number(e.target.value), pointsAvailable, subtotal)))}
              className={styles.pointsInput}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>결제 금액</h2>
        <div className={styles.summaryLines}>
          <div className={styles.summaryLine}><span>상품금액</span><span>{subtotal.toLocaleString()}원</span></div>
          <div className={styles.summaryLine}><span>배송비</span><span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span></div>
          {couponDiscount > 0 && <div className={`${styles.summaryLine} ${styles.discount}`}><span>쿠폰 할인</span><span>-{couponDiscount.toLocaleString()}원</span></div>}
          {pointsUsed > 0 && <div className={`${styles.summaryLine} ${styles.discount}`}><span>포인트 사용</span><span>-{pointsUsed.toLocaleString()}원</span></div>}
        </div>
        <div className={styles.summaryTotal}>
          <span>총 결제 금액</span><span>{total.toLocaleString()}원</span>
        </div>
        {orderComplete ? (
          <div className={styles.completeBox}>
            <div className="checkmarkPop" style={{ fontSize: 28 }}>✅</div>
            <p className={styles.completeText}>주문이 완료되었습니다!</p>
            <p className={styles.completeMeta}>주문번호: {orderComplete}</p>
            <Link href={`/orders/${orderComplete}`} className={styles.completeLink}>주문 상세 보기 →</Link>
          </div>
        ) : null}
      </section>

      {!orderComplete && (
        <div className="stickyCheckoutBar">
          <div className={styles.checkoutBarLabel}>
            총 결제금액
            <div className={styles.checkoutBarTotal}>{total.toLocaleString()}원</div>
          </div>
          <button type="button" onClick={handleOrder} className={styles.checkoutBtn}>
            결제하기
          </button>
        </div>
      )}
    </main>
  );
}
