'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
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
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>주문 상세</h1>
        <p className={styles.orderId}>주문 번호: {order.id}</p>
        <div className={styles.itemList}>
          {order.items.map((item) => (
            <div key={item.productId} className={styles.item}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemMeta}>수량 {item.quantity}개 · {item.unitPrice.toLocaleString()}원</div>
            </div>
          ))}
        </div>
        <div className={styles.totalRow}>배송비 {order.shippingFee.toLocaleString()}원 · 총액 {order.total.toLocaleString()}원</div>
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
