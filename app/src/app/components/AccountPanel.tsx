'use client';

import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import { REVIEW_LABEL, uploadBusinessCert, type ReviewStatus } from '../lib/account';
import { useMockStore } from '../lib/mockStore';
import { supabase } from '../lib/supabase';
import { KakaoButton } from './KakaoButton';

const STATUS_COLOR: Record<ReviewStatus, string> = { pending: '#b26b00', approved: '#2f6f4f', rejected: '#c93442', suspended: '#888' };
const box = { background: '#fff', borderRadius: 18, padding: 16, display: 'grid', gap: 10, border: '1px solid #eee' } as const;

/** 마이페이지 상단: 가입 상태, 사업자·도매처 승인 상태, 등록증 업로드, 연락처 */
export function AccountPanel() {
  const { user, account, refreshAccount } = useMockStore();
  const [phone, setPhone] = useState(account?.profile?.phone ?? '');
  const [name, setName] = useState(account?.profile?.name ?? '');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!supabase) return null;

  if (user.role === 'guest') {
    return (
      <section style={box}>
        <b style={{ fontSize: 16 }}>카카오로 가입하면 주문 내역이 저장돼요</b>
        <p style={{ fontSize: 13, color: '#666' }}>다른 폰에서도 내 주문을 보고, 새 공구 소식도 받을 수 있어요.</p>
        <KakaoButton next="/mypage" />
        <Link href="/auth/business" style={{ fontSize: 13, color: '#2f6fed', fontWeight: 700 }}>매장 사장님·도매처라면 사업자 가입 →</Link>
      </section>
    );
  }

  const review = account?.vendor ?? account?.business ?? null;
  const reviewKind = account?.vendor ? '입점 도매처' : account?.business ? '사업자 회원' : null;

  const onCert = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    const result = await uploadBusinessCert(file);
    setUploading(false);
    setMessage(result.error ? `올리지 못했습니다: ${result.error}` : '사업자등록증을 받았습니다. 확인 후 승인해드릴게요.');
    if (!result.error) await refreshAccount();
  };

  const saveProfile = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from('profiles').update({ name: name.trim() || null, phone: phone.trim() || null }).eq('user_id', data.user.id);
    setMessage(error ? `저장하지 못했습니다: ${error.message}` : '저장했습니다. 다음 주문부터 자동으로 채워져요.');
    if (!error) await refreshAccount();
  };

  return (
    <section style={box}>
      {review && reviewKind && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 16 }}>{review.companyName}</b>
            <span style={{ fontSize: 12, fontWeight: 800, color: STATUS_COLOR[review.status], border: `1px solid ${STATUS_COLOR[review.status]}`, borderRadius: 999, padding: '2px 8px' }}>
              {reviewKind} · {REVIEW_LABEL[review.status]}
            </span>
          </div>
          {review.status === 'pending' && (
            <p style={{ fontSize: 13, color: '#666' }}>
              {review.hasCert ? '사업자등록증을 확인 중입니다. 승인되면 바로 이용할 수 있어요.' : '사업자등록증을 올려주시면 확인 후 승인해드립니다.'}
            </p>
          )}
          {review.status === 'rejected' && <p style={{ fontSize: 13, color: '#c93442' }}>반려 사유: {review.reviewNote || '고객센터로 문의해주세요.'}</p>}
          {review.status === 'approved' && account?.business && <p style={{ fontSize: 13, color: '#2f6f4f' }}>도매가가 열린 상품은 상품 화면에서 &lsquo;도매가로 구매&rsquo;를 고르면 됩니다.</p>}
          {account?.vendor && (
            <Link href="/vendor" style={{ fontWeight: 800, color: '#2f6fed', fontSize: 14 }}>입점 관리 화면으로 →</Link>
          )}
          {(review.status === 'pending' || review.status === 'rejected') && (
            <label style={{ fontSize: 13, fontWeight: 700, color: '#2f6fed', cursor: 'pointer' }}>
              {uploading ? '올리는 중…' : review.hasCert ? '사업자등록증 다시 올리기' : '사업자등록증 올리기'}
              <input type="file" accept="image/*,application/pdf" onChange={(e) => void onCert(e)} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      )}

      {!account?.isAdmin && (
        <div style={{ display: 'grid', gap: 8, borderTop: review ? '1px solid #f0ece8' : 0, paddingTop: review ? 10 : 0 }}>
          <b style={{ fontSize: 14 }}>주문할 때 쓸 정보</b>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <label htmlFor="my-name" className="visually-hidden">이름</label>
            <input id="my-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름"
              style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', fontSize: 15, minWidth: 0 }} />
            <label htmlFor="my-phone" className="visually-hidden">연락처</label>
            <input id="my-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" inputMode="tel"
              style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', fontSize: 15, minWidth: 0 }} />
          </div>
          <button type="button" onClick={() => void saveProfile()} style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 10, padding: '9px', fontWeight: 700 }}>저장</button>
        </div>
      )}
      {message && <p style={{ fontSize: 13, fontWeight: 700, color: message.includes('못') ? '#c93442' : '#2f6f4f' }}>{message}</p>}
    </section>
  );
}
