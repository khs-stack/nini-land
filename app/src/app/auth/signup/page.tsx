'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useMockStore();
  const [name, setName] = useState('김예원');
  const [email, setEmail] = useState('wholesale@example.com');
  const [password, setPassword] = useState('password123');
  const [wholesaleRequested, setWholesaleRequested] = useState(true);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    signup(name, email, password, wholesaleRequested);
    router.push('/');
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>회원가입</h1>
        <p className={styles.helper}>일반회원 가입 또는 사업자 인증 신청을 목업으로 테스트합니다.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input className={styles.input} value={name} onChange={(event) => setName(event.target.value)} placeholder="이름" />
          <input className={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" />
          <input className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={wholesaleRequested} onChange={() => setWholesaleRequested((value) => !value)} />
            사업자 승인 요청하기
          </label>
          <button className={styles.button} type="submit">가입하기</button>
        </form>
        <div className={styles.linkRow}>
          <Link href="/auth/login">로그인</Link>
          <Link href="/">홈으로</Link>
        </div>
      </section>
    </main>
  );
}
