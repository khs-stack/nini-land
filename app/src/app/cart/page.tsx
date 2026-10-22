'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { calculateShippingFee, useMockStore } from '../lib/mockStore';
import styles from './Cart.module.css';

const COUPON = { code: 'NINI5000', discount: 5000, label: '5,000원 할인 쿠폰' };

type PaymentMethod = 'card' | 'bank';

export default function CartPage() {
  const { cartItems, products, updateQuantity, removeFromCart, createOrder, addresses } = useMockStore();
  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
  const [recipient, setRecipient] = useState(defaultAddress?.recipient ?? '');
  const [phone, setPhone] = useState(defaultAddress?.phone ?? '');
  const [address, setAddress] = useState(defaultAddress?.address ?? '');
  const [memo, setMemo] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [pointsAvailable] = useState(3000);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );
  const shippingFee = calculateShippingFee(subtotal);
  const couponDiscount = couponApplied ? Math.min(COUPON.discount, subtotal) : 0;
  const totalDiscount = couponDiscount + pointsUsed;
  const total = Math.max(0, subtotal + shippingFee - totalDiscount);

  const handleOrder = () => {
    setFormError('');
    if (!recipient.trim() || !phone.trim() || !address.trim()) {
      setFormError('수령인, 연락처, 배송지 주소를 모두 입력해주세요.');
      return;
    }
    if (!/^01\d-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ''))) {
      setFormError('연락처를 010-1234-5678 형식으로 확인해주세요.');
      return;
    }

    const { order, error } = createOrder({
      recipient: recipient.trim(),
      phone: phone.trim(),
      address: address.trim(),
      memo: memo.trim(),
      paymentMethod,
      discount: totalDiscount,
    });
    if (order) {
      setOrderComplete(order.id);
    } else {
      setFormError(error ?? '주문을 접수하지 못했습니다. 장바구니를 다시 확인해주세요.');
    }
  };

  if (cartItems.length === 0 && !orderComplete) {
    return (
      <main className={styles.emptyPage}>
        <EmptyState
          icon="🛒"
          title="장바구니가 비어 있습니다"
          description="상품 상세에서 컬러와 사이즈를 선택한 뒤 담아주세요."
          actionLabel="전체 상품 보기"
          actionHref="/search"
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p>ORDER</p>
          <h1>주문하기</h1>
        </div>
        <Link href="/search" className={styles.continueLink}>상품 더 보기</Link>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>주문 상품</h2>
          <span className={styles.itemCount}>{cartItems.length}개 옵션</span>
        </div>

        <div className={styles.itemList}>
          {cartItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const isWholesaleItem = item.priceType === 'wholesale' && product;
            const unit = isWholesaleItem ? Math.max(product!.orderUnit, 1) : 1;
            const atMinimum = isWholesaleItem && item.quantity <= product!.minOrderQty;
            return (
              <div key={item.cartKey} className={styles.item}>
                <div className={styles.itemImageWrap}>
                  <Image src={item.image || '/placeholder-product.svg'} alt={item.name} fill sizes="88px" className={styles.itemImage} />
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>{item.name}</div>
                  {(item.color || item.size) ? (
                    <div className={styles.itemOption}>{item.color}{item.color && item.size ? ' / ' : ''}{item.size}</div>
                  ) : (
                    <div className={styles.itemOptionWarning}>옵션 정보 없음 · 상품 상세에서 다시 선택 권장</div>
                  )}
                  <div className={styles.itemPriceType}>
                    {item.priceType === 'wholesale' ? '사업자 공급가' : '일반 판매가'} · {item.unitPrice.toLocaleString()}원
                  </div>
                  {isWholesaleItem && (
                    <div className={styles.itemOptionWarning}>최소 {product!.minOrderQty}개 · {unit}개 단위 주문</div>
                  )}
                  <div className={styles.itemControls}>
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartKey, item.quantity - unit)}
                        className={styles.stepperBtn}
                        aria-label={`${item.name} 수량 줄이기`}
                        disabled={atMinimum}
                      >
                        −
                      </button>
                      <span className={styles.stepperValue}>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.cartKey, item.quantity + unit)} className={styles.stepperBtn} aria-label={`${item.name} 수량 늘리기`}>+</button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.cartKey)} className={styles.removeBtn}>삭제</button>
                    <div className={styles.itemTotal}>{(item.unitPrice * item.quantity).toLocaleString()}원</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>배송 정보</h2>
          {defaultAddress && <span>기본 배송지 자동 입력</span>}
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>수령인</span>
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="수령인 이름" className={styles.input} />
          </label>
          <label className={styles.field}>
            <span>연락처</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-1234-5678" className={styles.input} inputMode="tel" />
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>배송지 주소</span>
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="배송지 주소" className={styles.input} />
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>배송 메모</span>
            <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="예: 문 앞에 놓아주세요" className={styles.input} />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>할인 적용</h2>
        <div className={styles.discountOptions}>
          <label className={styles.couponRow}>
            <div>
              <b>{COUPON.label}</b>
              <span>쿠폰코드 {COUPON.code}</span>
            </div>
            <input type="checkbox" checked={couponApplied} onChange={(event) => setCouponApplied(event.target.checked)} />
          </label>
          <label className={styles.pointsRow}>
            <div>
              <b>포인트 사용</b>
              <span>보유 {pointsAvailable.toLocaleString()}P</span>
            </div>
            <input
              type="number"
              min={0}
              max={Math.min(pointsAvailable, Math.max(0, subtotal - couponDiscount))}
              value={pointsUsed}
              onChange={(event) => setPointsUsed(Math.max(0, Math.min(Number(event.target.value), pointsAvailable, Math.max(0, subtotal - couponDiscount))))}
              className={styles.pointsInput}
            />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>결제 수단</h2>
        <div className={styles.paymentGrid}>
          <label className={`${styles.paymentCard} ${paymentMethod === 'card' ? styles.selected : ''}`}>
            <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
            <b>카드 결제</b>
            <span>목업 단계의 테스트 결제</span>
          </label>
          <label className={`${styles.paymentCard} ${paymentMethod === 'bank' ? styles.selected : ''}`}>
            <input type="radio" name="payment" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
            <b>무통장 입금</b>
            <span>주문 후 입금 계좌 안내</span>
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>최종 결제 금액</h2>
        <div className={styles.summaryLines}>
          <div className={styles.summaryLine}><span>상품금액</span><span>{subtotal.toLocaleString()}원</span></div>
          <div className={styles.summaryLine}><span>배송비</span><span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span></div>
          {couponDiscount > 0 && <div className={`${styles.summaryLine} ${styles.discount}`}><span>쿠폰 할인</span><span>-{couponDiscount.toLocaleString()}원</span></div>}
          {pointsUsed > 0 && <div className={`${styles.summaryLine} ${styles.discount}`}><span>포인트 사용</span><span>-{pointsUsed.toLocaleString()}원</span></div>}
        </div>
        <div className={styles.summaryTotal}><span>총 결제 금액</span><span>{total.toLocaleString()}원</span></div>
        {paymentMethod === 'bank' && <p className={styles.bankNotice}>주문 완료 후 테스트 입금 계좌가 표시됩니다.</p>}
        {formError && <p className={styles.formError}>{formError}</p>}

        {orderComplete && (
          <div className={styles.completeBox}>
            <div className="checkmarkPop" aria-hidden="true">✅</div>
            <p className={styles.completeText}>주문이 정상적으로 접수되었습니다.</p>
            <p className={styles.completeMeta}>주문번호: {orderComplete}</p>
            {paymentMethod === 'bank' && <p className={styles.completeMeta}>테스트 입금계좌: 니니은행 123-456-789012</p>}
            <Link href={`/orders/${orderComplete}`} className={styles.completeLink}>주문 상세 확인 →</Link>
          </div>
        )}
      </section>

      {!orderComplete && (
        <div className="stickyCheckoutBar">
          <div className={styles.checkoutBarLabel}>
            <span>총 결제금액</span>
            <strong>{total.toLocaleString()}원</strong>
          </div>
          <button type="button" onClick={handleOrder} className={styles.checkoutBtn}>
            {paymentMethod === 'card' ? '테스트 결제하기' : '주문 접수하기'}
          </button>
        </div>
      )}
    </main>
  );
}
