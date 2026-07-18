'use client';

import { useRouter } from 'next/navigation';
import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';
import styles from '../admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, products, orders, members, cers } = useMockStore();

  if (user.role !== 'admin') {
    return (
      <EmptyState
        icon="🔐"
        title="접근 권한이 없습니다"
        description="관리자만 접근할 수 있습니다."
        actionLabel="홈으로"
        actionHref="/"
      />
    );
  }

  const stats = [
    { label: '총 상품', value: products.length, href: '/admin/products' },
    { label: '총 주문', value: orders.length, href: '/admin/orders' },
    { label: '취소·교환·반품', value: cers.length, href: '/admin/returns' },
    { label: '회원 수', value: members.length, href: '/admin/members' },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>관리자 대시보드</h1>

        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={styles.statCard}
              onClick={() => router.push(stat.href)}
            >
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.menuGrid}>
          <div className={styles.menuItem}>
            <h3>📦 상품 관리</h3>
            <ul>
              <li><a href="/admin/products">상품 등록 · 수정 · 삭제</a></li>
            </ul>
          </div>

          <div className={styles.menuItem}>
            <h3>📋 주문 관리</h3>
            <ul>
              <li><a href="/admin/orders">주문 · 배송 상태 관리</a></li>
              <li><a href="/admin/returns">취소 · 교환 · 반품</a></li>
            </ul>
          </div>

          <div className={styles.menuItem}>
            <h3>👥 회원 관리</h3>
            <ul>
              <li><a href="/admin/members">전체 회원 · 사업자 승인</a></li>
            </ul>
          </div>

          <div className={styles.menuItem}>
            <h3>📢 기타</h3>
            <ul>
              <li><a href="/admin/announcements">공지사항</a></li>
              <li><a href="/admin/popup">팝업 관리</a></li>
              <li><a href="/admin/settings">홈 화면 설정</a></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
