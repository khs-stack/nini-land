'use client';

import { useEffect, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { isStoreOpen, type StoreSettings } from '../../lib/mockSettings';

type TextKey = { [K in keyof StoreSettings]: StoreSettings[K] extends string ? K : never }[keyof StoreSettings];
type NumberKey = { [K in keyof StoreSettings]: StoreSettings[K] extends number ? K : never }[keyof StoreSettings];

const input = { border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15, width: '100%', minWidth: 0 } as const;
const card = { background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 } as const;
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 } as const;

export default function AdminSettingsPage() {
  const { settings, updateSettings, isAdmin, catalogLoaded } = useMockStore();
  const [draft, setDraft] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    // DB에서 설정을 처음 받아오면 입력칸에 채운다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (catalogLoaded) setDraft(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogLoaded]);

  if (!isAdmin) return null;

  const text = (key: TextKey, labelText: string, placeholder = '', hint = '') => (
    <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444', minWidth: 0 }}>
      {labelText}
      <input id={`s-${key}`} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} placeholder={placeholder} style={input} />
      {hint && <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>{hint}</span>}
    </label>
  );
  const num = (key: NumberKey, labelText: string, hint = '') => (
    <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444', minWidth: 0 }}>
      {labelText}
      <input id={`s-${key}`} type="number" min={0} inputMode="numeric" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: Math.max(0, Number(e.target.value)) })} style={input} />
      {hint && <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>{hint}</span>}
    </label>
  );

  const save = async (next: StoreSettings = draft) => {
    setSaving(true);
    setMessage(null);
    const result = await updateSettings(next);
    setSaving(false);
    setMessage(result.error ? { ok: false, text: result.error } : { ok: true, text: '저장했습니다. 손님 화면에 바로 반영됩니다.' });
  };

  const missing = [
    !draft.companyName.trim() && '상호',
    !draft.representative.trim() && '대표자',
    !draft.businessNumber.trim() && '사업자등록번호',
    !draft.mailOrderNumber.trim() && '통신판매업 신고번호',
    !draft.address.trim() && '사업장 주소',
    !draft.contactPhone.trim() && '고객센터 전화',
    !draft.bankAccount.trim() && '입금 계좌번호',
    !draft.bankHolder.trim() && '예금주',
  ].filter(Boolean) as string[];

  const liveOpen = isStoreOpen(settings);

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 90 }}>
      <section style={{ ...card, border: liveOpen ? '2px solid #2f6f4f' : '2px solid #c93442' }}>
        <h1 style={{ fontSize: 22 }}>쇼핑몰 설정</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <b style={{ fontSize: 16, color: liveOpen ? '#2f6f4f' : '#c93442' }}>{liveOpen ? '● 지금 주문 받는 중' : '● 주문 닫힘 (구경만 가능)'}</b>
            <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              {missing.length
                ? `열기 전에 채울 것: ${missing.join(', ')}`
                : '필수 정보가 모두 들어갔습니다.'}
            </p>
          </div>
          <button
            type="button"
            disabled={saving || (!draft.storeOpen && missing.length > 0)}
            onClick={() => { const next = { ...draft, storeOpen: !draft.storeOpen }; setDraft(next); void save(next); }}
            style={{ border: 0, borderRadius: 12, padding: '12px 16px', fontWeight: 800, fontSize: 15, background: draft.storeOpen ? '#fff0f0' : '#2f6f4f', color: draft.storeOpen ? '#c93442' : '#fff' }}
          >
            {draft.storeOpen ? '주문 닫기' : '주문 받기 시작'}
          </button>
        </div>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 17 }}>사업자 정보 <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>· 사이트 맨 아래에 표시 (전자상거래법 필수)</span></h2>
        <div style={grid}>
          {text('companyName', '상호', '사업자등록증의 상호')}
          {text('representative', '대표자')}
          {text('businessNumber', '사업자등록번호', '000-00-00000')}
          {text('mailOrderNumber', '통신판매업 신고번호', '제2026-부산OO-0000호')}
          {text('privacyOfficer', '개인정보 보호책임자', '이름 (연락처 또는 이메일)')}
        </div>
        {text('address', '사업장 주소', '사업자등록증 주소')}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 17 }}>무통장 입금 계좌</h2>
        <div style={grid}>
          {text('bankName', '은행', '예: 카카오뱅크')}
          {text('bankAccount', '계좌번호', '숫자와 - 만')}
          {text('bankHolder', '예금주', '사업자 계좌 권장')}
        </div>
        {num('depositDeadlineHours', '입금 기한 (시간)', '주문 완료 화면에 "N시간 안에 입금" 으로 안내. 0이면 문구 없음')}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 17 }}>배송비</h2>
        <div style={grid}>
          {num('shippingFee', '기본 배송비 (원)')}
          {num('freeShippingThreshold', '무료배송 기준 금액 (원)', '0이면 항상 배송비 부과')}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 17 }}>고객센터</h2>
        <div style={grid}>
          {text('contactPhone', '전화번호', '010-0000-0000')}
          {text('contactEmail', '이메일')}
          {text('kakaoId', '카카오톡 아이디')}
          {text('openChatUrl', '카카오 오픈채팅 링크', 'https://open.kakao.com/...')}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 17 }}>홈 화면 문구</h2>
        {text('heroTitle', '소개 제목')}
        <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444' }}>
          소개 설명
          <textarea id="s-heroDescription" value={draft.heroDescription} onChange={(e) => setDraft({ ...draft, heroDescription: e.target.value })} style={{ ...input, minHeight: 70 }} />
        </label>
      </section>

      <div style={{ position: 'sticky', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)', display: 'grid', gap: 8 }}>
        {message && (
          <p style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: message.ok ? '#eef8f2' : '#fff0f0', color: message.ok ? '#2f6f4f' : '#c93442' }}>
            {message.text}
          </p>
        )}
        <button type="button" onClick={() => void save()} disabled={saving}
          style={{ border: 0, borderRadius: 14, padding: '14px', background: '#111', color: '#fff', fontWeight: 800, fontSize: 16, boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
          {saving ? '저장 중…' : '설정 저장'}
        </button>
      </div>
    </main>
  );
}
