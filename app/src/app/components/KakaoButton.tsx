'use client';

import { useState } from 'react';
import { useMockStore } from '../lib/mockStore';

/** 카카오 간편가입·로그인 버튼 (카카오 브랜드 색상 가이드: #FEE500 배경, 검정 85% 글자) */
export function KakaoButton({ next = '/', label = '카카오로 3초 만에 시작하기' }: { next?: string; label?: string }) {
  const { loginWithKakao } = useMockStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setError('');
    setBusy(true);
    const result = await loginWithKakao(next);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        style={{
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
