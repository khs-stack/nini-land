'use client';

import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { EmptyState } from '../../components/EmptyState';

export default function WholesaleInfoPage() {
  const { user, updateProfile } = useMockStore();
  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [businessRegNumber, setBusinessRegNumber] = useState(user.businessRegNumber ?? '');
  const [businessAddress, setBusinessAddress] = useState(user.businessAddress ?? '');
  const [saved, setSaved] = useState(false);

  if (!user.role.includes('wholesale') && user.role !== 'admin') {
    return (
      <EmptyState
        icon="🏢"
        title="사업자 회원만 이용할 수 있습니다"
        description="사업자 회원가입 후 이용해주세요."
        actionLabel="사업자 회원가입"
        actionHref="/auth/signup-wholesale"
      />
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile({ companyName, businessRegNumber, businessAddress });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>사업자정보 관리</h1>
      {user.role === 'wholesale_pending' && (
        <div style={{ background: '#fffaf0', border: '1px solid #f0d9a6', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: '#a26500' }}>
          현재 사업자 인증을 확인하고 있습니다. 관리자 승인 완료 후 도매가격과 도매 주문 기능을 이용할 수 있습니다.
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 20, display: 'grid', gap: 12 }}>
        <label style={{ fontSize: 13, color: '#666' }}>
          상호명
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, color: '#666' }}>
          사업자등록번호
          <input value={businessRegNumber} onChange={(e) => setBusinessRegNumber(e.target.value)} placeholder="000-00-00000" style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, color: '#666' }}>
          사업장 주소
          <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <button type="submit" style={{ border: 0, borderRadius: 10, padding: '12px', background: '#111', color: 'white', fontWeight: 700 }}>저장하기</button>
        {saved && <p style={{ color: '#0f7a4f', fontSize: 13, textAlign: 'center' }}>사업자정보가 저장되었습니다.</p>}
      </form>
    </main>
  );
}
