'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useMockStore, type CancelExchangeReturnType } from '../../lib/mockStore';
import styles from './OrderDetail.module.css';

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
  const searchParams = useSearchParams();
  const { orders, cers, createCER, user, isAdmin } = useMockStore();
  const order = orders.find((item) => item.id === id);
  const [activeForm, setActiveForm] = useState<CancelExchangeReturnType | null>(null);
  const [reason, setReason] = useState('');

  if (!order) {
    return <main style={{ padding: 24 }}>주문 정보를 찾을 수 없습니다.</main>;
  }

  // 본인 주문이거나 관리자이거나, 비회원 주문조회에서 연락처가 일치해 넘어온 경우만 상세를 보여준다.
  const verifiedPhone = searchParams.get('phone');
  const isOwner = order.userId === user.id;
  const isVerifiedGuest = !!verifiedPhone && verifiedPhone === order.phone;
  if (!isOwner && !isAdmin && !isVerifiedGuest) {
    return (
      <main style={{ padding: 24, display: 'grid', gap: 12, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p>이 주문을 볼 수 있는 권한이 없습니다.</p>
        <Link href="/orders/lookup" style={{ color: '#2f6fed', fontWeight: 700 }}>비회원 주문조회로 확인하기 →</Link>
      </main>
    );
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
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>주문 상세</h1>
        <p className={styles.orderId}>주문번호: {order.id}</p>
        <div className={styles.itemList}>
          {order.items.map((item) => (
            <div key={item.cartKey} className={styles.item}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemMeta}>
                {[item.color, item.size].filter(Boolean).join(' / ') || '옵션 없음'} · 수량 {item.quantity}개 · {(item.unitPrice * item.quantity).toLocaleString()}원
              </div>
            </div>
          ))}
        </div>
        <div className={styles.orderFacts}>
          <div><span>수령인</span><b>{order.recipient}</b></div>
          {order.phone && <div><span>연락처</span><b>{order.phone}</b></div>}
          {order.address && <div><span>배송지</span><b>{order.address}</b></div>}
          <div><span>결제수단</span><b>{order.paymentMethod === 'bank' ? '무통장 입금' : '카드 결제(목업)'}</b></div>
          {order.memo && <div><span>배송메모</span><b>{order.memo}</b></div>}
        </div>
        <div className={styles.totalRow}>
          상품금액 {(order.subtotal ?? order.total - order.shippingFee).toLocaleString()}원
          {order.discount ? ` · 할인 -${order.discount.toLocaleString()}원` : ''}
          {' · '}배송비 {order.shippingFee.toLocaleString()}원 · 총액 {order.total.toLocaleString()}원
        </div>
        <div className={styles.shippingLinkRow}>
          <Link href="/shipping" className={styles.shippingLink}>배송 조회</Link>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>취소 · 교환 · 반품</h2>

        {orderCers.length > 0 && (
          <div className={styles.cerList}>
            {orderCers.map((cer) => (
              <div key={cer.id} className={styles.cerItem}>
                <div>
                  <div className={styles.cerType}>{typeLabels[cer.type]} 신청</div>
                  <div className={styles.cerReason}>{cer.reason}</div>
                </div>
                <span className={`${styles.cerStatus} ${cer.status === 'completed' ? styles.completed : styles.pending}`}>
                  {statusLabels[cer.status]}
                </span>
              </div>
            ))}
          </div>
        )}

        {canRequest && (
          <>
            {!activeForm ? (
              <div className={styles.requestButtons}>
                {(['cancel', 'exchange', 'return'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveForm(type)}
                    className={styles.requestButton}
                  >
                    {typeLabels[type]} 신청
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formTitle}>{typeLabels[activeForm]} 신청</div>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={`${typeLabels[activeForm]} 사유를 입력해주세요`}
                  className={styles.textarea}
                />
                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitBtn}>
                    신청하기
                  </button>
                  <button type="button" onClick={() => setActiveForm(null)} className={styles.cancelBtn}>
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
