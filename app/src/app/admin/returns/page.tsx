'use client';

import { useMockStore, type CERStatus } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';

const typeLabels: Record<string, string> = { cancel: '취소', exchange: '교환', return: '반품' };
const statusLabels: Record<CERStatus, string> = { requested: '신청됨', approved: '승인됨', rejected: '거절됨', completed: '완료' };
const statusColors: Record<CERStatus, string> = {
  requested: '#a26500',
  approved: '#2f6fed',
  rejected: '#e5484d',
  completed: '#0f7a4f',
};

export default function AdminReturnsPage() {
  const { user, cers, updateCERStatus } = useMockStore();

  if (user.role !== 'admin') {
    return <EmptyState icon="🔐" title="접근 권한이 없습니다" description="관리자만 접근할 수 있습니다." actionLabel="홈으로" actionHref="/" />;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>취소·교환·반품 관리</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>고객이 신청한 취소/교환/반품 건을 확인하고 처리 상태를 변경합니다.</p>

        {cers.length === 0 ? (
          <EmptyState icon="📭" title="접수된 신청이 없습니다" description="고객이 취소·교환·반품을 신청하면 여기에 표시됩니다." />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {cers.map((cer) => (
              <div key={cer.id} style={{ border: '1px solid #eee', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{typeLabels[cer.type]}</span>
                    <span style={{ color: '#999', marginLeft: 8, fontSize: 13 }}>주문번호 {cer.orderId}</span>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', background: statusColors[cer.status] }}>
                    {statusLabels[cer.status]}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>사유: {cer.reason}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['approved', 'rejected', 'completed'] as CERStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={cer.status === status}
                      onClick={() => updateCERStatus(cer.id, status)}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        padding: '8px 14px',
                        background: cer.status === status ? '#f2f2f2' : '#fff',
                        fontSize: 13,
                        cursor: cer.status === status ? 'default' : 'pointer',
                        opacity: cer.status === status ? 0.5 : 1,
                      }}
                    >
                      {statusLabels[status]}(으)로 변경
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
