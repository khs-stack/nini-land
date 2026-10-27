'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { DEMO_LOGIN_ENABLED, useMockStore } from '../../lib/mockStore';
import { supabase } from '../../lib/supabase';
import { KakaoButton } from '../../components/KakaoButton';
import styles from '../auth.module.css';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/mypage';
  const { login } = useMockStore();
  const [email, setEmail] = useState(DEMO_LOGIN_ENABLED ? 'member@example.com' : '');
  const [password, setPassword] = useState(DEMO_LOGIN_ENABLED ? 'password123' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(next);
  };

  return (
    <main className={styles.page}>
      {supabase && (
        <section className={styles.card} style={{ display: 'grid', gap: 12 }}>
          <h1 style={{ fontSize: 22 }}>로그인 · 회원가입</h1>
          <p className={styles.helper}>
            카카오로 가입하면 주문 내역이 자동으로 저장되고, 새 공구 소식을 받을 수 있어요.
            가입 없이도 주문은 할 수 있습니다.
          </p>
          <KakaoButton next={next} />
          <Link href="/groupbuy" style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>가입 없이 둘러보기</Link>
        </section>
      )}

      <section className={styles.card}>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>{supabase ? '사업자 · 입점 도매처 · 관리자 로그인' : '로그인'}</h2>
        <p className={styles.helper} style={{ marginBottom: 12 }}>
          {supabase ? '사업자등록증으로 가입한 이메일 계정으로 로그인하세요.' : '이메일과 비밀번호를 입력해주세요.'}
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="login-email" className="visually-hidden">이메일</label>
          <input id="login-email" className={styles.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" autoComplete="username" />
          <label htmlFor="login-password" className="visually-hidden">비밀번호</label>
          <input id="login-password" className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" autoComplete="current-password" />
          {error && <p style={{ color: '#c93442', fontSize: 13, fontWeight: 700 }}>{error}</p>}
          <button className={styles.button} type="submit" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
        </form>
        <div className={styles.linkRow} style={{ marginTop: 14 }}>
          <Link href="/auth/business">사업자 · 도매처 가입하기</Link>
          <Link href="/">홈으로</Link>
        </div>
      </section>
    </main>
  );
}
