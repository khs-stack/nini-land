'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';

const input = { border: '1px solid #ddd', borderRadius: 12, padding: '12px 12px', fontSize: 16 } as const;

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNo, setOrderNo] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!orderNo.trim() || !phone.trim()) {
      setError('주문번호와 연락처를 모두 입력해주세요.');
      return;
    }
    if (supabase) {
      setBusy(true);
      const { data } = await supabase.rpc('get_order', { p_order_no: orderNo.trim(), p_phone: phone });
      setBusy(false);
      if (!data) {
        setError('일치하는 주문을 찾을 수 없습니다. 주문번호와 주문할 때 입력한 연락처를 다시 확인해주세요.');
        return;
      }
    }
    router.push(`/orders/${encodeURIComponent(orderNo.trim())}?phone=${encodeURIComponent(phone.trim())}`);
  };

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 16 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>주문 조회</h1>
        <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>주문 완료 화면에 나온 주문번호와 주문할 때 입력한 연락처로 입금·배송 상태를 확인할 수 있습니다.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <label htmlFor="lookup-order" className="visually-hidden">주문번호</label>
          <input id="lookup-order" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="주문번호 (예: 261027-1234)" style={input} />
          <label htmlFor="lookup-phone" className="visually-hidden">연락처</label>
          <input id="lookup-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처 (010-1234-5678)" inputMode="tel" style={input} />
          <button type="submit" disabled={busy} style={{ border: 0, borderRadius: 12, padding: '13px 14px', background: '#111', color: 'white', fontWeight: 700, fontSize: 15 }}>
            {busy ? '조회 중…' : '조회하기'}
          </button>
        </form>
        {error && <p style={{ marginTop: 16, color: '#e5484d', fontSize: 14 }}>{error}</p>}
      </section>
    </main>
  );
}
