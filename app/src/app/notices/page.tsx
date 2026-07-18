'use client';

import { useMockStore } from '../lib/mockStore';
import { EmptyState } from '../components/EmptyState';

export default function NoticesPage() {
  const { announcements } = useMockStore();

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <h1 style={{ fontSize: 24 }}>공지사항</h1>
      {announcements.length === 0 ? (
        <EmptyState icon="📢" title="등록된 공지사항이 없습니다" />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {announcements.map((a) => (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#999', margin: '4px 0 10px' }}>{new Date(a.createdAt).toLocaleDateString('ko-KR')}</div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
