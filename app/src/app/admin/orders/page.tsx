'use client';

import { useMemo, useState } from 'react';
import { useMockStore, type OrderSummary } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';

const statusLabels: Record<OrderSummary['status'], string> = {
  pending: '결제대기',
  confirmed: '결제완료',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '취소완료',
};

export default function AdminOrdersPage() {
  const { user, orders, updateOrderStatus } = useMockStore();
  const [statusFilter, setStatusFilter] = useState<'all' | OrderSummary['status']>('all');

  const filteredOrders = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  if (user.role !== 'admin') {
    return <EmptyState icon="🔐" title="접근 권한이 없습니다" description="관리자만 접근할 수 있습니다." actionLabel="홈으로" actionHref="/" />;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>주문 · 배송 관리</h1>
            <p style={{ color: '#666' }}>주문 상태를 확인하고 배송 상태를 변경할 수 있습니다.</p>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderSummary['status'])} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
            <option value="all">전체 상태</option>
            {(Object.keys(statusLabels) as OrderSummary['status'][]).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState icon="📭" title="해당하는 주문 내역이 없습니다" />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredOrders.map((order) => (
              <div key={order.id} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{order.id}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{order.recipient} · {order.total.toLocaleString()}원 · {order.createdAt}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#f2f2f2', height: 'fit-content' }}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.keys(statusLabels) as OrderSummary['status'][]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={order.status === status}
                      onClick={() => updateOrderStatus(order.id, status)}
                      style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 12, background: order.status === status ? '#f2f2f2' : '#fff', opacity: order.status === status ? 0.5 : 1 }}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
