'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { isGroupbuyClosed, salePrice } from '../lib/mockProducts';
import { isStoreOpen } from '../lib/mockSettings';
import { useMockStore, type PlacedOrder } from '../lib/mockStore';
import { formatPhone } from '../lib/supabase';
import styles from './Cart.module.css';

export default function CartPage() {
  const { cartItems, products, updateQuantity, removeFromCart, createOrder, addresses, settings, catalogLoaded, isAdmin } = useMockStore();
  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
  const [recipient, setRecipient] = useState(defaultAddress?.recipient ?? '');
  const [phone, setPhone] = useState(defaultAddress?.phone ?? '');
  const [address, setAddress] = useState(defaultAddress?.address ?? '');
  const [memo, setMemo] = useState('');
  const [depositor, setDepositor] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const open = isStoreOpen(settings);

  // 화면 금액도 장바구니에 담을 때 가격이 아니라 지금 상품 가격으로 다시 계산한다 (최종 금액은 서버가 확정).
  const lines = useMemo(
    () =>
      cartItems.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const unitPrice = product ? salePrice(product) : item.unitPrice;
        const closed = product ? isGroupbuyClosed(product) : false;
        const sizeStock = product?.options?.find((o) => o.color === item.color)?.sizes.find((s) => s.size === item.size)?.stock;
        const soldOut = product?.options?.length ? (sizeStock ?? 0) <= 0 : false;
        const missing = catalogLoaded && !product;
        return { item, product, unitPrice, closed, soldOut, missing };
      }),
    [cartItems, products, catalogLoaded]
  );
  const blocked = lines.filter((line) => line.closed || line.soldOut || line.missing);

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.item.quantity, 0);
  const shippingFee = subtotal === 0 || (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) ? 0 : settings.shippingFee;
  const total = subtotal + shippingFee;

  const handleOrder = async () => {
    setFormError('');
    if (!open && !isAdmin) {
      setFormError('지금은 주문을 받지 않고 있습니다. 오픈 공지를 확인해주세요.');
      return;
    }
    if (blocked.length) {
      setFormError('마감·품절된 상품을 장바구니에서 삭제한 뒤 주문해주세요.');
      return;
    }
    if (!recipient.trim() || !phone.trim() || !address.trim()) {
      setFormError('받는 분, 연락처, 배송지 주소를 모두 입력해주세요.');
      return;
    }
    if (!/^01\d-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ''))) {
      setFormError('연락처를 010-1234-5678 형식으로 확인해주세요.');
      return;
    }
    if (!agreed) {
      setFormError('주문 내용과 공구 안내를 확인하고 동의에 체크해주세요.');
      return;
    }

    setSubmitting(true);
    const { order, error } = await createOrder({
      recipient: recipient.trim(),
      phone: phone.trim(),
      address: address.trim(),
      memo: memo.trim(),
      depositorName: (depositor.trim() || recipient.trim()),
    });
    setSubmitting(false);
    if (order) {
      setPlaced(order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormError(error ?? '주문을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (placed) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.completeBox}>
            <div className="checkmarkPop" aria-hidden="true">✅</div>
            <p className={styles.completeText}>주문이 접수되었습니다</p>
            <p className={styles.completeMeta}>주문번호 <b>{placed.orderNo}</b></p>
          </div>
          <div className={styles.summaryLines} style={{ marginTop: 16 }}>
            <div className={styles.summaryLine}><span>입금하실 금액</span><b>{placed.total.toLocaleString()}원</b></div>
            <div className={styles.summaryLine}><span>입금 계좌</span><b>{settings.bankName} {settings.bankAccount}</b></div>
            <div className={styles.summaryLine}><span>예금주</span><b>{settings.bankHolder}</b></div>
          </div>
          <p className={styles.bankNotice}>
            {settings.depositDeadlineHours > 0 ? `주문 후 ${settings.depositDeadlineHours}시간 안에 ` : ''}
            입금해주세요. 입금이 확인되면 주문이 확정되고, 공구 마감 후 도매처에 일괄 주문해 순차 발송합니다.
            입금자명이 주문자와 다르면 확인이 늦어질 수 있습니다.
          </p>
          <p className={styles.completeMeta} style={{ marginTop: 12 }}>
            주문번호와 연락처({formatPhone(placed.phone)})로 언제든 주문 상태를 확인할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <Link href={`/orders/${placed.orderNo}?phone=${encodeURIComponent(placed.phone)}`} className={styles.completeLink}>주문 상세 보기 →</Link>
            <Link href="/" className={styles.continueLink}>쇼핑 계속하기</Link>
          </div>
        </section>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className={styles.emptyPage}>
        <EmptyState
          icon="🛒"
          title="장바구니가 비어 있습니다"
          description="상품 상세에서 컬러와 사이즈를 선택한 뒤 담아주세요."
          actionLabel="공구 상품 보기"
          actionHref="/groupbuy"
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
        <Link href="/groupbuy" className={styles.continueLink}>상품 더 보기</Link>
      </div>

      {!open && (
        <p className={styles.formError} style={{ marginTop: 0 }}>
          {isAdmin ? '관리자 테스트 주문만 가능한 상태입니다. (손님 주문은 아직 닫혀 있음)' : '지금은 주문을 받지 않고 있습니다. 오픈 공지를 확인해주세요.'}
        </p>
      )}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>주문 상품</h2>
          <span className={styles.itemCount}>{cartItems.length}개 옵션</span>
        </div>

        <div className={styles.itemList}>
          {lines.map(({ item, unitPrice, closed, soldOut, missing }) => (
            <div key={item.cartKey} className={styles.item}>
              <div className={styles.itemImageWrap}>
                <Image src={item.image || '/placeholder-product.svg'} alt={item.name} fill sizes="88px" className={styles.itemImage} />
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemName}>{item.name}</div>
                {(item.color || item.size) && (
                  <div className={styles.itemOption}>{item.color}{item.color && item.size ? ' / ' : ''}{item.size}</div>
                )}
                <div className={styles.itemPriceType}>공구가 · {unitPrice.toLocaleString()}원</div>
                {(closed || soldOut || missing) && (
                  <div className={styles.itemOptionWarning}>
                    {missing ? '판매가 끝난 상품입니다. 삭제해주세요.' : closed ? '공구가 마감되었습니다. 삭제해주세요.' : '품절된 옵션입니다. 삭제해주세요.'}
                  </div>
                )}
                <div className={styles.itemControls}>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                      className={styles.stepperBtn}
                      aria-label={`${item.name} 수량 줄이기`}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className={styles.stepperValue}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, Math.min(99, item.quantity + 1))}
                      className={styles.stepperBtn}
                      aria-label={`${item.name} 수량 늘리기`}
                    >
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.cartKey)} className={styles.removeBtn}>삭제</button>
                  <div className={styles.itemTotal}>{(unitPrice * item.quantity).toLocaleString()}원</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>배송 정보</h2>
          {defaultAddress && <span>저장된 배송지 자동 입력</span>}
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>받는 분</span>
            <input id="order-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="이름" className={styles.input} autoComplete="name" maxLength={50} />
          </label>
          <label className={styles.field}>
            <span>연락처</span>
            <input id="order-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-1234-5678" className={styles.input} inputMode="tel" autoComplete="tel" maxLength={13} />
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>배송지 주소</span>
            <input id="order-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="도로명 주소 + 상세주소 (동·호수)" className={styles.input} autoComplete="street-address" maxLength={300} />
          </label>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>배송 메모 (선택)</span>
            <input id="order-memo" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="예: 문 앞에 놓아주세요" className={styles.input} maxLength={200} />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>결제 방법 · 무통장 입금</h2>
        <div className={styles.formGrid}>
          <label className={`${styles.field} ${styles.fullField}`}>
            <span>입금자명</span>
            <input id="order-depositor" value={depositor} onChange={(event) => setDepositor(event.target.value)} placeholder={recipient ? `비워두면 '${recipient}'(으)로 접수` : '입금하실 분 이름'} className={styles.input} maxLength={50} />
          </label>
        </div>
        <p className={styles.bankNotice}>
          주문을 접수하면 입금 계좌가 바로 안내됩니다.
          {settings.depositDeadlineHours > 0 && ` ${settings.depositDeadlineHours}시간 안에 입금이 확인되지 않으면 주문이 취소될 수 있습니다.`}
        </p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>결제 금액</h2>
        <div className={styles.summaryLines}>
          <div className={styles.summaryLine}><span>상품금액</span><span>{subtotal.toLocaleString()}원</span></div>
          <div className={styles.summaryLine}>
            <span>배송비{settings.freeShippingThreshold > 0 ? ` (${settings.freeShippingThreshold.toLocaleString()}원 이상 무료)` : ''}</span>
            <span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span>
          </div>
        </div>
        <div className={styles.summaryTotal}><span>입금하실 금액</span><span>{total.toLocaleString()}원</span></div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>
          <input id="order-agree" type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} style={{ marginTop: 3 }} />
          <span>
            공구 상품은 마감 후 도매처에 일괄 주문해 발송되어 받기까지 시간이 걸릴 수 있음을 확인했으며,
            주문 상품·금액과 <Link href="/terms">이용약관</Link>·<Link href="/privacy">개인정보 수집·이용</Link>에 동의합니다.
          </span>
        </label>
        {formError && <p className={styles.formError}>{formError}</p>}
      </section>

      <div className="stickyCheckoutBar">
        <div className={styles.checkoutBarLabel}>
          <span>입금하실 금액</span>
          <strong>{total.toLocaleString()}원</strong>
        </div>
        <button type="button" onClick={handleOrder} className={styles.checkoutBtn} disabled={submitting}>
          {submitting ? '접수 중…' : '주문 접수하기'}
        </button>
      </div>
    </main>
  );
}
