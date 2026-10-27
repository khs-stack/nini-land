'use client';

import Link from 'next/link';
import { KakaoButton } from './KakaoButton';

/** 예전 회원가입 주소로 들어오면: 일반 고객은 카카오 간편가입, 사업자는 사업자 가입으로 안내 */
export function SignupClosed() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20, display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: 22 }}>회원가입</h1>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>일반 고객은 카카오로 바로 가입돼요. 가입 없이 주문해도 됩니다.</p>
        <KakaoButton next="/mypage" />
      </section>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20, display: 'grid', gap: 8 }}>
        <b>매장 사장님 · 도매처이신가요?</b>
        <p style={{ color: '#666', fontSize: 14 }}>사업자등록증으로 가입하면 도매 구매나 입점 판매를 할 수 있어요.</p>
        <Link href="/auth/business" style={{ fontWeight: 800, color: '#2f6fed' }}>사업자 · 도매처 가입 →</Link>
      </section>
    </main>
  );
}
