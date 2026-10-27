'use client';

import { useCallback, useEffect, useState } from 'react';
import { REVIEW_LABEL, type ReviewStatus } from '../../lib/account';
import { useMockStore } from '../../lib/mockStore';
import { formatPhone, supabase } from '../../lib/supabase';

interface VendorRow {
  id: string; company_name: string; business_number: string; representative: string | null; phone: string | null; email: string | null;
  address: string | null; mail_order_number: string | null; bank_name: string | null; bank_account: string | null; bank_holder: string | null;
  cert_path: string | null; status: ReviewStatus; review_note: string | null; default_deal_type: 'commission' | 'purchase';
  default_commission_rate: number; created_at: string;
}
interface BusinessRow {
  user_id: string; company_name: string; business_number: string; representative: string | null; phone: string | null;
  address: string | null; cert_path: string | null; status: ReviewStatus; review_note: string | null; created_at: string;
}

type Tab = 'vendor' | 'business' | 'member';
const STATUS_COLOR: Record<ReviewStatus, string> = { pending: '#b26b00', approved: '#2f6f4f', rejected: '#c93442', suspended: '#888' };
const btn = (primary = false) => ({ border: primary ? 0 : '1px solid #ddd', borderRadius: 10, padding: '9px 12px', background: primary ? '#111' : '#fff', color: primary ? '#fff' : '#111', fontSize: 13, fontWeight: 700 }) as const;
const input = { border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 14, minWidth: 0 } as const;

async function openCert(path: string | null) {
  if (!supabase || !path) return;
  const { data } = await supabase.storage.from('business-docs').createSignedUrl(path, 300);
  if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
}

export default function AdminMembersPage() {
  const { isAdmin } = useMockStore();
  const [tab, setTab] = useState<Tab>('vendor');
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    const [v, b, m] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('business_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
    ]);
    setVendors((v.data ?? []) as VendorRow[]);
    setBusinesses((b.data ?? []) as BusinessRow[]);
    setMemberCount(m.count ?? 0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2500);
  };

  const updateVendor = async (id: string, patch: Partial<VendorRow>) => {
    if (!supabase) return;
    const { error } = await supabase.from('vendors').update({ ...patch, reviewed_at: new Date().toISOString() }).eq('id', id);
    flash(error ? `저장 실패: ${error.message}` : '저장했습니다.');
    await load();
  };
  const updateBusiness = async (userId: string, patch: Partial<BusinessRow>) => {
    if (!supabase) return;
    const { error } = await supabase.from('business_accounts').update({ ...patch, reviewed_at: new Date().toISOString() }).eq('user_id', userId);
    flash(error ? `저장 실패: ${error.message}` : '저장했습니다.');
    await load();
  };

  if (!isAdmin) return null;
  const pendingV = vendors.filter((v) => v.status === 'pending').length;
  const pendingB = businesses.filter((b) => b.status === 'pending').length;

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: 22 }}>가입 승인 · 회원</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="tablist">
          {([['vendor', `입점 도매처 ${pendingV ? `(대기 ${pendingV})` : ''}`], ['business', `사업자 회원 ${pendingB ? `(대기 ${pendingB})` : ''}`], ['member', '카카오 회원']] as Array<[Tab, string]>).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} style={{ ...btn(tab === key), borderRadius: 999 }}>{label}</button>
          ))}
        </div>
        {toast && <p style={{ background: '#eef8f2', color: '#2f6f4f', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{toast}</p>}
      </section>

      {tab === 'vendor' && (vendors.length === 0 ? <Empty text="아직 입점 신청이 없습니다." /> : vendors.map((v) => <VendorCard key={v.id} v={v} onSave={(patch) => void updateVendor(v.id, patch)} />))}
      {tab === 'business' && (businesses.length === 0 ? <Empty text="아직 사업자 가입 신청이 없습니다." /> : businesses.map((b) => <BusinessCard key={b.user_id} b={b} onSave={(patch) => void updateBusiness(b.user_id, patch)} />))}
      {tab === 'member' && (
        <section style={{ background: '#fff', borderRadius: 16, padding: 16, fontSize: 14 }}>
          가입한 계정 <b>{memberCount ?? '–'}</b>개 (카카오 회원 + 사업자 + 도매처 + 관리자). 카카오 회원은 승인 없이 바로 이용합니다.
        </section>
      )}
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ textAlign: 'center', color: '#888', padding: 30 }}>{text}</p>;
}

function Facts({ rows }: { rows: Array<[string, string | null | undefined]> }) {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7em) minmax(0, 1fr)', gap: '3px 10px', fontSize: 13, margin: 0 }}>
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}><dt style={{ color: '#888' }}>{k}</dt><dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{v}</dd></div>
      ))}
    </dl>
  );
}

function StatusPill({ status }: { status: ReviewStatus }) {
  return <span style={{ fontSize: 12, fontWeight: 800, color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}`, borderRadius: 999, padding: '2px 8px' }}>{REVIEW_LABEL[status]}</span>;
}

function VendorCard({ v, onSave }: { v: VendorRow; onSave: (patch: Partial<VendorRow>) => void }) {
  const [deal, setDeal] = useState(v.default_deal_type);
  const [rate, setRate] = useState(String(v.default_commission_rate));
  const [note, setNote] = useState(v.review_note ?? '');
  return (
    <article style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 10, border: v.status === 'pending' ? '2px solid #e8590c' : '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <b style={{ fontSize: 16 }}>{v.company_name}</b><StatusPill status={v.status} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{new Date(v.created_at).toLocaleDateString('ko-KR')} 신청</span>
      </div>
      <Facts rows={[['사업자번호', v.business_number], ['대표자', v.representative], ['연락처', v.phone ? formatPhone(v.phone) : null], ['이메일', v.email],
        ['주소', v.address], ['통신판매업', v.mail_order_number], ['정산 계좌', [v.bank_name, v.bank_account, v.bank_holder].filter(Boolean).join(' ')]]} />
      <button type="button" style={{ ...btn(), justifySelf: 'start' }} disabled={!v.cert_path} onClick={() => void openCert(v.cert_path)}>
        {v.cert_path ? '사업자등록증 보기' : '등록증 아직 안 올림'}
      </button>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 700 }}>기본 거래 조건</span>
        <label htmlFor={`deal-${v.id}`} className="visually-hidden">거래 방식</label>
        <select id={`deal-${v.id}`} value={deal} onChange={(e) => setDeal(e.target.value as VendorRow['default_deal_type'])} style={input}>
          <option value="commission">수수료</option>
          <option value="purchase">사입(매입가)</option>
        </select>
        {deal === 'commission' && (
          <>
            <label htmlFor={`rate-${v.id}`} className="visually-hidden">수수료율</label>
            <input id={`rate-${v.id}`} type="number" min={0} max={100} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} style={{ ...input, width: 80 }} />%
          </>
        )}
      </div>
      <label htmlFor={`note-${v.id}`} className="visually-hidden">메모·반려 사유</label>
      <input id={`note-${v.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="반려 사유 또는 메모 (도매처에게 보임)" style={input} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {v.status !== 'approved' && (
          <button type="button" style={btn(true)} onClick={() => onSave({ status: 'approved', default_deal_type: deal, default_commission_rate: Number(rate) || 0, review_note: note || null })}>입점 승인</button>
        )}
        {v.status === 'approved' && (
          <button type="button" style={btn()} onClick={() => onSave({ default_deal_type: deal, default_commission_rate: Number(rate) || 0, review_note: note || null })}>조건 저장</button>
        )}
        {v.status === 'pending' && <button type="button" style={{ ...btn(), color: '#c93442' }} onClick={() => onSave({ status: 'rejected', review_note: note || '서류 확인이 필요합니다.' })}>반려</button>}
        {v.status === 'approved' && <button type="button" style={{ ...btn(), color: '#888' }} onClick={() => onSave({ status: 'suspended', review_note: note || null })}>이용 정지</button>}
        {(v.status === 'suspended' || v.status === 'rejected') && <button type="button" style={btn()} onClick={() => onSave({ status: 'pending' })}>대기로 되돌리기</button>}
      </div>
    </article>
  );
}

function BusinessCard({ b, onSave }: { b: BusinessRow; onSave: (patch: Partial<BusinessRow>) => void }) {
  const [note, setNote] = useState(b.review_note ?? '');
  return (
    <article style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 10, border: b.status === 'pending' ? '2px solid #e8590c' : '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <b style={{ fontSize: 16 }}>{b.company_name}</b><StatusPill status={b.status} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{new Date(b.created_at).toLocaleDateString('ko-KR')} 신청</span>
      </div>
      <Facts rows={[['사업자번호', b.business_number], ['대표자', b.representative], ['연락처', b.phone ? formatPhone(b.phone) : null], ['주소', b.address]]} />
      <button type="button" style={{ ...btn(), justifySelf: 'start' }} disabled={!b.cert_path} onClick={() => void openCert(b.cert_path)}>
        {b.cert_path ? '사업자등록증 보기' : '등록증 아직 안 올림'}
      </button>
      <label htmlFor={`bnote-${b.user_id}`} className="visually-hidden">반려 사유</label>
      <input id={`bnote-${b.user_id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="반려 사유 (신청자에게 보임)" style={input} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {b.status !== 'approved' && <button type="button" style={btn(true)} onClick={() => onSave({ status: 'approved', review_note: null })}>사업자 승인</button>}
        {b.status === 'pending' && <button type="button" style={{ ...btn(), color: '#c93442' }} onClick={() => onSave({ status: 'rejected', review_note: note || '서류 확인이 필요합니다.' })}>반려</button>}
        {b.status === 'approved' && <button type="button" style={{ ...btn(), color: '#888' }} onClick={() => onSave({ status: 'rejected', review_note: note || '승인 취소' })}>승인 취소</button>}
        {b.status === 'rejected' && <button type="button" style={btn()} onClick={() => onSave({ status: 'pending' })}>대기로 되돌리기</button>}
      </div>
    </article>
  );
}
