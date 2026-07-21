'use client';

import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';

export default function MemberInfoPage() {
  const { user, updateProfile } = useMockStore();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile({ name, email, phone });
    setPassword('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>회원정보 수정</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 20, display: 'grid', gap: 12 }}>
        <label style={{ fontSize: 13, color: '#666' }}>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, color: '#666' }}>
          이메일
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, color: '#666' }}>
          연락처
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, color: '#666' }}>
          새 비밀번호 (변경 시에만 입력)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" style={{ display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />
        </label>
        <button type="submit" style={{ border: 0, borderRadius: 10, padding: '12px', background: '#111', color: 'white', fontWeight: 700 }}>저장하기</button>
        {saved && <p style={{ color: '#0f7a4f', fontSize: 13, textAlign: 'center' }}>회원정보가 저장되었습니다.</p>}
      </form>
    </main>
  );
}
