'use client';

import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';

export default function AdminPopupPage() {
  const { user, popups, addPopup, updatePopup, deletePopup } = useMockStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  if (user.role !== 'admin') {
    return <EmptyState icon="🔐" title="접근 권한이 없습니다" description="관리자만 접근할 수 있습니다." actionLabel="홈으로" actionHref="/" />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addPopup(title.trim(), content.trim(), startDate, endDate);
    setTitle('');
    setContent('');
  };

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>팝업 관리</h1>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="팝업 제목" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="팝업 내용" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 70 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#666' }}>
              노출 시작일
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 13, color: '#666' }}>
              노출 종료일
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', marginTop: 4 }} />
            </label>
          </div>
          <button type="submit" style={{ border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: 'white', fontWeight: 700 }}>팝업 등록</button>
        </form>

        <div style={{ display: 'grid', gap: 10 }}>
          {popups.map((p) => (
            <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={p.visible} onChange={(e) => updatePopup(p.id, { visible: e.target.checked })} />
                  노출
                </label>
              </div>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{p.content}</p>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                {new Date(p.startDate).toLocaleDateString('ko-KR')} ~ {new Date(p.endDate).toLocaleDateString('ko-KR')}
              </div>
              <button type="button" onClick={() => deletePopup(p.id)} style={{ border: 0, borderRadius: 8, padding: '6px 12px', background: '#e5484d', color: 'white', fontSize: 13 }}>삭제</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
