'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useMockStore();
  const [email, setEmail] = useState('member@example.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login(email, password);
    router.push('/');
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>로그인</h1>
        <p className={styles.helper}>관리자, 도매회원, 일반회원 역할을 테스트해볼 수 있습니다.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input className={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" />
          <input className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" />
          <button className={styles.button} type="submit">로그인</button>
        </form>
        <div className={styles.linkRow}>
          <Link href="/auth/signup">회원가입</Link>
          <Link href="/">홈으로</Link>
        </div>
      </section>
    </main>
  );
}
