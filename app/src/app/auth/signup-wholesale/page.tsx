'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import styles from '../auth.module.css';

export default function SignupWholesalePage() {
  const router = useRouter();
  const { signup } = useMockStore();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [salesChannels, setSalesChannels] = useState('');
  const [products, setProducts] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!agreed) {
      alert('약관에 동의해주세요.');
      return;
    }
    signup(name, email, password, true);
    router.push('/');
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>사업자 회원가입</h1>
        <p className={styles.helper}>사업자 회원으로 가입하여 도매가를 확인하고 주문할 수 있습니다.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>대표자 정보</legend>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="대표자명"
              required
            />
            <input
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="연락처"
              required
            />
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              type="email"
              required
            />
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              type="password"
              required
            />
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>사업 정보</legend>
            <input
              className={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="상호명"
              required
            />
            <input
              className={styles.input}
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              placeholder="사업자등록번호 (예: 123-45-67890)"
              required
            />
            <div style={{ fontSize: 13, color: '#999' }}>
              사업자등록증: (목업 - 실제 업로드는 추후 구현)
            </div>
            <input
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="사업장주소"
              required
            />
            <input
              className={styles.input}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="배송지주소"
              required
            />
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>판매 정보</legend>
            <input
              className={styles.input}
              value={salesChannels}
              onChange={(e) => setSalesChannels(e.target.value)}
              placeholder="판매채널 (예: 온라인몰, 오프라인점)"
            />
            <input
              className={styles.input}
              value={products}
              onChange={(e) => setProducts(e.target.value)}
              placeholder="취급품목 (예: 아동복, 유아용품)"
            />
          </fieldset>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              style={{ marginTop: 3 }}
            />
            <span>
              약관 및 개인정보처리방침에 동의하며, 사업자 승인 대기 중임을 이해합니다.
            </span>
          </label>

          <button className={styles.button} type="submit" disabled={!agreed}>
            가입하기
          </button>
        </form>
        <div className={styles.linkRow}>
          <Link href="/auth/signup">일반회원 가입</Link>
          <Link href="/">홈으로</Link>
        </div>
      </section>
    </main>
  );
}
