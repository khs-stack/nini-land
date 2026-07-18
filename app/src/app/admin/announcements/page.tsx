'use client';

import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';

export default function AdminAnnouncementsPage() {
  const { user, announcements, addAnnouncement, deleteAnnouncement } = useMockStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (user.role !== 'admin') {
    return <EmptyState icon="🔐" title="접근 권한이 없습니다" description="관리자만 접근할 수 있습니다." actionLabel="홈으로" actionHref="/" />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addAnnouncement(title.trim(), content.trim());
    setTitle('');
    setContent('');
  };

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>공지사항 관리</h1>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 90 }} />
          <button type="submit" style={{ border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: 'white', fontWeight: 700 }}>공지 등록</button>
        </form>

        <div style={{ display: 'grid', gap: 10 }}>
          {announcements.map((a) => (
            <div key={a.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{a.content}</p>
              </div>
              <button type="button" onClick={() => deleteAnnouncement(a.id)} style={{ border: 0, borderRadius: 8, padding: '8px 12px', background: '#e5484d', color: 'white', fontSize: 13, height: 'fit-content' }}>삭제</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
