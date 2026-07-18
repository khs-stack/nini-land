'use client';

import Link from 'next/link';
import { useMockStore } from '../lib/mockStore';
import styles from './shipping.module.css';

export default function ShippingPage() {
  const { orders } = useMockStore();
  const latest = orders[0];

  const shippingStatuses = [
    { step: 1, label: '주문완료', completed: true },
    { step: 2, label: '결제완료', completed: true },
    { step: 3, label: '상품준비중', completed: true },
    { step: 4, label: '배송준비중', completed: true },
    { step: 5, label: '배송중', completed: false },
    { step: 6, label: '배송완료', completed: false },
  ];

  const timeline = [
    { date: '2024-07-19 10:30', status: '주문완료', location: '시스템' },
    { date: '2024-07-19 10:35', status: '결제완료', location: '시스템' },
    { date: '2024-07-19 14:00', status: '상품준비중', location: '물류센터' },
    { date: '2024-07-19 16:30', status: '배송준비중', location: '배송사' },
    { date: '2024-07-20 08:00', status: '배송중', location: 'OO택배 (운송장: 1234567890)' },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>배송 조회</h1>
        </div>

        {latest ? (
          <>
            <section className={styles.section}>
              <h2>배송 상태</h2>
              <div className={styles.progressSteps}>
                {shippingStatuses.map((item, idx) => (
                  <div key={idx} className={`${styles.step} ${item.completed ? styles.completed : ''}`}>
                    <div className={styles.stepCircle}>{item.step}</div>
                    <div className={styles.stepLabel}>{item.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2>배송 타임라인</h2>
              <div className={styles.timeline}>
                {timeline.map((event, idx) => (
                  <div key={idx} className={styles.timelineEvent}>
                    <div className={styles.timelineMarker} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDate}>{event.date}</div>
                      <div className={styles.timelineStatus}>{event.status}</div>
                      <div className={styles.timelineLocation}>{event.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2>배송 정보</h2>
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>주문번호</span>
                  <span className={styles.value}>{latest.id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>운송사</span>
                  <span className={styles.value}>OO택배</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>운송장번호</span>
                  <span className={styles.value}>1234567890</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>예상 배송일</span>
                  <span className={styles.value}>2024-07-21 (일요일)</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>수령인</span>
                  <span className={styles.value}>{latest.recipient}</span>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className={styles.empty}>
            <p>배송 정보가 없습니다.</p>
            <Link href="/orders">주문내역 확인</Link>
          </div>
        )}
      </div>
    </main>
  );
}
