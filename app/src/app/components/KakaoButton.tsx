'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMockStore } from '../lib/mockStore';

// 가입 필수 동의 (개인정보 보호법: 수집·이용 동의, 만 14세 미만은 법정대리인 동의 필요 → 14세 이상만 가입)
const CONSENTS = [
  { key: 'age', text: '만 14세 이상입니다' },
  { key: 'terms', text: '이용약관에 동의합니다', href: '/terms' },
  { key: 'privacy', text: '개인정보 수집·이용에 동의합니다', href: '/privacy' },
] as const;

/** 카카오 간편가입·로그인 버튼 (카카오 브랜드 색상 가이드: #FEE500 배경, 검정 85% 글자) */
export function KakaoButton({ next = '/', label = '카카오로 3초 만에 시작하기' }: { next?: string; label?: string }) {
  const { loginWithKakao } = useMockStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const allAgreed = CONSENTS.every((c) => agreed[c.key]);

  const start = async () => {
    if (!allAgreed) { setError('필수 항목에 모두 동의해주세요.'); return; }
    setError('');
    setBusy(true);
    const result = await loginWithKakao(next);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <fieldset style={{ border: '1px solid #eee', borderRadius: 12, padding: '10px 12px', display: 'grid', gap: 6, margin: 0 }}>
        <legend className="visually-hidden">가입 동의</legend>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 800 }}>
          <input type="checkbox" checked={allAgreed} onChange={(e) => setAgreed(Object.fromEntries(CONSENTS.map((c) => [c.key, e.target.checked])))} />
          모두 동의 (필수)
        </label>
        {CONSENTS.map((c) => (
          <label key={c.key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#555', paddingLeft: 4 }}>
            <input type="checkbox" checked={Boolean(agreed[c.key])} onChange={(e) => setAgreed((a) => ({ ...a, [c.key]: e.target.checked }))} />
            <span>[필수] {c.text}</span>
            {'href' in c && <Link href={c.href} target="_blank" style={{ marginLeft: 'auto', fontSize: 12, color: '#888', textDecoration: 'underline' }}>보기</Link>}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        aria-disabled={!allAgreed}
        style={{
          opacity: allAgreed ? 1 : 0.5,
          border: 0,
          borderRadius: 12,
          padding: '14px',
          background: '#FEE500',
          color: 'rgba(0,0,0,0.85)',
          fontWeight: 800,
          fontSize: 15,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#000" d="M12 3C6.48 3 2 6.5 2 10.8c0 2.78 1.86 5.22 4.66 6.6l-.95 3.47c-.08.3.26.54.52.37l4.13-2.73c.54.07 1.09.11 1.64.11 5.52 0 10-3.5 10-7.82C22 6.5 17.52 3 12 3z" />
        </svg>
        {busy ? '카카오로 이동 중…' : label}
      </button>
      {error && <p style={{ color: '#c93442', fontSize: 13, fontWeight: 700 }}>{error}</p>}
    </div>
  );
}
