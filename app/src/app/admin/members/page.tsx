'use client';

import { useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';

const roleLabels: Record<string, string> = {
  member: '일반회원',
  wholesale_pending: '사업자 승인대기',
  wholesale_approved: '도매회원',
  admin: '관리자',
};

export default function AdminMembersPage() {
  const { user, members, approveMember, rejectMember } = useMockStore();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | string>('all');

  const pending = members.filter((m) => m.role === 'wholesale_pending');

  const others = useMemo(() => {
    return members
      .filter((m) => m.role !== 'wholesale_pending')
      .filter((m) => roleFilter === 'all' || m.role === roleFilter)
      .filter((m) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      });
  }, [members, roleFilter, query]);

  if (user.role !== 'admin') {
    return <EmptyState icon="🔐" title="접근 권한이 없습니다" description="관리자만 접근할 수 있습니다." actionLabel="홈으로" actionHref="/" />;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>회원 관리</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>사업자 승인대기 회원을 승인하거나 거절할 수 있습니다.</p>

        {pending.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, marginBottom: 8, color: '#a26500' }}>사업자 승인 대기 ({pending.length})</h2>
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {pending.map((m) => (
                <div key={m.id} style={{ border: '1px solid #f0d9a6', background: '#fffaf0', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.name} · {m.companyName}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{m.email} · 사업자등록번호 {m.businessRegNumber}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => approveMember(m.id)} style={{ border: 0, borderRadius: 8, padding: '8px 14px', background: '#0f7a4f', color: 'white', fontSize: 13, fontWeight: 700 }}>승인</button>
                    <button type="button" onClick={() => rejectMember(m.id)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', background: '#fff', fontSize: 13 }}>거절</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <h2 style={{ fontSize: 16 }}>전체 회원 ({others.length})</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름/이메일 검색"
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
              <option value="all">전체 역할</option>
              <option value="member">일반회원</option>
              <option value="wholesale_approved">도매회원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {others.map((m) => (
            <div key={m.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{m.email} · 가입일 {m.joinedAt}</div>
              </div>
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: '#f2f2f2' }}>{roleLabels[m.role] ?? m.role}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
