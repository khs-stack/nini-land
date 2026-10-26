'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { DEMO_LOGIN_ENABLED, useMockStore } from '../../lib/mockStore';
import { supabase } from '../../lib/supabase';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
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
    router.push(supabase ? '/admin/orders' : '/');
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{supabase ? '관리자 로그인' : '로그인'}</h1>
        <p className={styles.helper}>
          {supabase
            ? '쇼핑몰 운영자 전용입니다. 손님은 로그인 없이 주문할 수 있어요.'
            : DEMO_LOGIN_ENABLED ? '관리자, 도매회원, 일반회원 역할을 테스트해볼 수 있습니다.' : '이메일과 비밀번호를 입력해주세요.'}
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input id="login-email" className={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" autoComplete="username" />
          <input id="login-password" className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" autoComplete="current-password" />
          {error && <p style={{ color: '#c93442', fontSize: 13, fontWeight: 700 }}>{error}</p>}
          <button className={styles.button} type="submit" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
        </form>
        <div className={styles.linkRow}>
          {!supabase && <Link href="/auth/signup">회원가입</Link>}
          <Link href="/">홈으로</Link>
        </div>
      </section>
    </main>
  );
}
