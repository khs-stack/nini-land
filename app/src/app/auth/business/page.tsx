'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { isValidBusinessNumber, signupBusiness, uploadBusinessCert, type SignupKind } from '../../lib/account';
import { useMockStore } from '../../lib/mockStore';
import styles from '../auth.module.css';

const KIND_INFO: Record<SignupKind, { title: string; body: string }> = {
  business: {
    title: '도매로 사는 사업자',
    body: '매장·온라인몰 사장님. 승인되면 도매가와 최소주문수량을 보고 묶음으로 주문할 수 있어요.',
  },
  vendor: {
    title: '상품을 파는 도매처 (입점)',
    body: '니니랜드에 상품을 올려 판매합니다. 올린 상품은 니니랜드 검수 후 판매가 시작되고, 판매 금액은 정산해드려요.',
  },
};

export default function BusinessSignupPage() {
  const { refreshAccount } = useMockStore();
  const [kind, setKind] = useState<SignupKind>('business');
  const [form, setForm] = useState({
    email: '', password: '', password2: '', name: '', phone: '',
    companyName: '', businessNumber: '', representative: '', address: '',
    mailOrderNumber: '', bankName: '', bankAccount: '', bankHolder: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { needsEmailConfirm: boolean; certUploaded: boolean }>(null);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) return setError('이메일과 비밀번호를 입력해주세요.');
    if (form.password.length < 8) return setError('비밀번호는 8자 이상으로 정해주세요.');
    if (form.password !== form.password2) return setError('비밀번호 확인이 일치하지 않습니다.');
    if (!form.companyName.trim() || !form.representative.trim()) return setError('상호와 대표자명을 입력해주세요.');
    if (!isValidBusinessNumber(form.businessNumber)) return setError('사업자등록번호 10자리를 확인해주세요. (예: 123-45-67890)');
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, ''))) return setError('연락처를 확인해주세요.');
    if (kind === 'vendor' && (!form.bankName.trim() || !form.bankAccount.trim() || !form.bankHolder.trim())) {
      return setError('정산받을 계좌(은행·계좌번호·예금주)를 입력해주세요.');
    }
    if (!agreeTerms) return setError('이용약관과 개인정보 수집·이용에 동의해주세요.');

    setBusy(true);
    const result = await signupBusiness({
      kind, email: form.email, password: form.password, name: form.name || form.representative, phone: form.phone,
      companyName: form.companyName, businessNumber: form.businessNumber, representative: form.representative, address: form.address,
      mailOrderNumber: form.mailOrderNumber, bankName: form.bankName, bankAccount: form.bankAccount, bankHolder: form.bankHolder,
      marketingAgree: agreeMarketing,
    });
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }
    let certUploaded = false;
    if (!result.needsEmailConfirm && certFile) {
      const upload = await uploadBusinessCert(certFile);
      certUploaded = !upload.error;
    }
    if (!result.needsEmailConfirm) await refreshAccount();
    setBusy(false);
    setDone({ needsEmailConfirm: Boolean(result.needsEmailConfirm), certUploaded });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (done) {
    return (
      <main className={styles.page}>
        <section className={styles.card} style={{ display: 'grid', gap: 12 }}>
          <h1 style={{ fontSize: 22 }}>가입 신청이 접수되었습니다</h1>
          {done.needsEmailConfirm ? (
            <p className={styles.helper}>
              <b>{form.email}</b>로 보낸 인증 메일의 링크를 눌러주세요. 인증 후 로그인하면 마이페이지에서 사업자등록증을 올릴 수 있습니다.
            </p>
          ) : (
            <p className={styles.helper}>
              {done.certUploaded ? '사업자등록증까지 받았습니다.' : '마이페이지에서 사업자등록증을 올려주세요.'} 니니랜드가 확인 후 승인하면
              {kind === 'business' ? ' 도매가로 구매할 수 있습니다.' : ' 입점 관리 화면에서 상품을 올릴 수 있습니다.'}
            </p>
          )}
          <Link href={done.needsEmailConfirm ? '/auth/login' : '/mypage'} className={styles.button} style={{ textAlign: 'center' }}>
            {done.needsEmailConfirm ? '로그인 화면으로' : '내 가입 상태 보기'}
          </Link>
        </section>
      </main>
    );
  }

  const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444' }}>
      {label}
      <input id={`biz-${key}`} className={styles.input} value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />
    </label>
  );

  return (
    <main className={styles.page}>
      <section className={styles.card} style={{ display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: 22 }}>사업자 · 도매처 가입</h1>
        <p className={styles.helper}>사업자는 가입이 꼭 필요해요. 신청 후 니니랜드가 사업자등록증을 확인하고 승인합니다.</p>
        <div role="radiogroup" aria-label="가입 유형" style={{ display: 'grid', gap: 8 }}>
          {(Object.keys(KIND_INFO) as SignupKind[]).map((k) => (
            <label key={k} style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 14, cursor: 'pointer',
              border: kind === k ? '2px solid #111' : '1px solid #ddd', background: kind === k ? '#faf8f6' : '#fff' }}>
              <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} style={{ marginTop: 3 }} />
              <span style={{ display: 'grid', gap: 3 }}>
                <b style={{ fontSize: 15 }}>{KIND_INFO[k].title}</b>
                <span style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{KIND_INFO[k].body}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <form onSubmit={submit} className={styles.card} style={{ display: 'grid', gap: 14 }}>
        <h2 style={{ fontSize: 17 }}>로그인 정보</h2>
        {field('email', '이메일', { type: 'email', autoComplete: 'email', placeholder: 'name@company.com' })}
        {field('password', '비밀번호 (8자 이상)', { type: 'password', autoComplete: 'new-password' })}
        {field('password2', '비밀번호 확인', { type: 'password', autoComplete: 'new-password' })}

        <h2 style={{ fontSize: 17, marginTop: 6 }}>사업자 정보</h2>
        {field('companyName', '상호')}
        {field('businessNumber', '사업자등록번호', { inputMode: 'numeric', placeholder: '123-45-67890' })}
        {field('representative', '대표자명')}
        {field('phone', '연락처', { inputMode: 'tel', placeholder: '010-1234-5678' })}
        {field('address', '사업장 주소')}
        {kind === 'vendor' && field('mailOrderNumber', '통신판매업 신고번호 (있으면)', { placeholder: '제2026-부산OO-0000호' })}

        {kind === 'vendor' && (
          <>
            <h2 style={{ fontSize: 17, marginTop: 6 }}>정산 계좌</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {field('bankName', '은행')}
              {field('bankAccount', '계좌번호', { inputMode: 'numeric' })}
              {field('bankHolder', '예금주')}
            </div>
          </>
        )}

        <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444' }}>
          사업자등록증 (사진 또는 PDF)
          <input id="biz-cert" type="file" accept="image/*,application/pdf" onChange={(e) => setCertFile(e.target.files?.[0] ?? null)} />
          <span style={{ fontWeight: 400, color: '#888' }}>지금 안 올려도 가입 후 마이페이지에서 올릴 수 있어요. 니니랜드 관리자만 볼 수 있습니다.</span>
        </label>

        <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input id="biz-agree" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ marginTop: 3 }} />
            <span>(필수) <Link href="/terms">이용약관</Link>과 <Link href="/privacy">개인정보 수집·이용</Link>에 동의합니다. 사업자 정보 확인을 위해 상호·사업자번호·등록증을 받습니다.</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input id="biz-marketing" type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)} style={{ marginTop: 3 }} />
            <span>(선택) 새 공구·도매 소식을 문자·카카오톡으로 받겠습니다.</span>
          </label>
        </div>

        {error && <p style={{ color: '#c93442', fontSize: 13, fontWeight: 700, background: '#fff0f0', padding: '10px 12px', borderRadius: 10 }}>{error}</p>}
        <button type="submit" className={styles.button} disabled={busy} style={{ padding: 14, fontWeight: 800 }}>
          {busy ? '신청 중…' : `${KIND_INFO[kind].title}로 가입 신청`}
        </button>
        <p className={styles.helper} style={{ textAlign: 'center' }}>
          이미 가입했다면 <Link href="/auth/login">로그인</Link>
        </p>
      </form>
    </main>
  );
}
