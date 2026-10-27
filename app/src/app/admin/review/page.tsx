'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { AUDIENCE_LABEL, CONSUMER_MODE_LABEL, DEAL_LABEL, FULFILLMENT_LABEL, type ColorOption, type ConsumerMode, type DealType, type Fulfillment, type WholesaleAudience } from '../../lib/mockProducts';
import { sharePreview } from '../../components/ProductEditor';
import { supabase } from '../../lib/supabase';

interface Payload {
  data: { name: string; description?: string; image: string; images?: string[]; consumerPrice: number; discountPrice?: number; kcCert?: string; options?: ColorOption[]; material?: string; madeIn?: string; manufacturer?: string };
  consumerMode: ConsumerMode;
  groupbuyEndsAt: string | null;
  wholesaleEnabled: boolean;
  wholesaleAudience: WholesaleAudience;
  wholesale: { price: number; minQty: number; orderUnit: number } | null;
  supplyPrice: number;
  fulfillment: Fulfillment;
}
interface Submission {
  id: string;
  vendor_id: string;
  product_id: string | null;
  payload: Payload;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  review_note: string | null;
  created_at: string;
  vendors: { company_name: string; default_deal_type: 'commission' | 'purchase'; default_commission_rate: number } | null;
}

const btn = (primary = false) => ({ border: primary ? 0 : '1px solid #ddd', borderRadius: 10, padding: '10px 13px', background: primary ? '#111' : '#fff', color: primary ? '#fff' : '#111', fontSize: 13, fontWeight: 700 }) as const;
const input = { border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 14, minWidth: 0 } as const;

export default function AdminReviewPage() {
  const { isAdmin, refreshCatalog } = useMockStore();
  const [items, setItems] = useState<Submission[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    const query = supabase.from('product_submissions')
      .select('*, vendors(company_name, default_deal_type, default_commission_rate)')
      .order('created_at', { ascending: false }).limit(200);
    const { data } = showDone ? await query.neq('status', 'pending') : await query.eq('status', 'pending');
    setItems((data ?? []) as Submission[]);
  }, [showDone]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 3000);
  };

  if (!isAdmin) return null;

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 10 }}>
        <h1 style={{ fontSize: 22 }}>도매처 상품 검수</h1>
        <p style={{ fontSize: 13, color: '#666' }}>
          도매처가 올린 상품과 수정 신청입니다. 거래 조건을 정해 승인하면 상품에 반영되고, &lsquo;바로 판매 개시&rsquo;를 체크하면 손님 화면에 바로 보입니다.
          판매 중인 상품의 수정 신청은 승인 전까지 기존 내용 그대로 팔립니다.
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={{ ...btn(!showDone), borderRadius: 999 }} onClick={() => setShowDone(false)}>검수 대기</button>
          <button type="button" style={{ ...btn(showDone), borderRadius: 999 }} onClick={() => setShowDone(true)}>처리 완료</button>
        </div>
        {toast && <p style={{ background: '#eef8f2', color: '#2f6f4f', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{toast}</p>}
      </section>

      {items.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: 30 }}>{showDone ? '처리한 신청이 없습니다.' : '검수할 신청이 없습니다.'}</p>}
      {items.map((s) => (
        <SubmissionCard key={s.id} s={s} onDone={(text) => { flash(text); void load(); void refreshCatalog(); }} />
      ))}
    </main>
  );
}

function SubmissionCard({ s, onDone }: { s: Submission; onDone: (text: string) => void }) {
  const p = s.payload;
  const [deal, setDeal] = useState<DealType>(s.vendors?.default_deal_type ?? 'commission');
  const [rate, setRate] = useState(String(s.vendors?.default_commission_rate ?? 0));
  const [wsRate, setWsRate] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>(p.fulfillment ?? 'vendor');
  const [publish, setPublish] = useState(!s.product_id);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const price = p.data.discountPrice || p.data.consumerPrice;
  const preview = sharePreview(price, deal, Number(rate) || 0, p.supplyPrice);
  const wsPreview = p.wholesale ? sharePreview(p.wholesale.price, deal, wsRate === '' ? Number(rate) || 0 : Number(wsRate), p.supplyPrice) : null;
  const optionSummary = (p.data.options ?? []).map((o) => `${o.color}(${o.sizes.map((x) => x.size).join('/')})`).join(', ');

  const approve = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc('approve_submission', {
      p_submission: s.id,
      p_terms: {
        dealType: deal,
        commissionRate: deal === 'commission' ? Number(rate) || 0 : 0,
        ...(deal === 'commission' && wsRate !== '' ? { wholesaleCommissionRate: Number(wsRate) } : { wholesaleCommissionRate: '' }),
        fulfillment,
        ...(s.product_id ? (publish ? { publish: true } : {}) : { publish }),
        note,
      },
    });
    setBusy(false);
    onDone(error ? `승인 실패: ${error.message}` : `${p.data.name} 승인 완료${publish ? ' · 판매 개시' : ''}`);
  };

  const reject = async () => {
    if (!supabase) return;
    if (!note.trim()) {
      onDone('반려 사유를 적어주세요. 도매처에게 그대로 보입니다.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('reject_submission', { p_submission: s.id, p_note: note.trim() });
    setBusy(false);
    onDone(error ? `반려 실패: ${error.message}` : `${p.data.name} 반려했습니다.`);
  };

  return (
    <article style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 12, border: s.status === 'pending' ? '2px solid #e8590c' : '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.data.image} alt="" style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: '#f4f1ee' }} />
        <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <b style={{ fontSize: 16 }}>{p.data.name}</b>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#7048e8', border: '1px solid #7048e8', borderRadius: 6, padding: '1px 6px' }}>{s.vendors?.company_name}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#555' }}>{s.product_id ? '수정 신청' : '새 상품'}</span>
          </div>
          <span style={{ fontSize: 12, color: '#999' }}>{new Date(s.created_at).toLocaleString('ko-KR')}</span>
          {p.data.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{p.data.description}</p>}
        </div>
      </div>

      {(p.data.images?.length ?? 0) > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.data.images!.map((img) => <img key={img} src={img} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />)}
        </div>
      )}

      <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 8em) minmax(0, 1fr)', gap: '4px 10px', fontSize: 13, margin: 0 }}>
        <dt style={{ color: '#888' }}>일반 판매</dt>
        <dd style={{ margin: 0 }}>{CONSUMER_MODE_LABEL[p.consumerMode]}{p.consumerMode !== 'none' && ` · 정가 ${p.data.consumerPrice.toLocaleString()}원${p.data.discountPrice ? ` → ${p.data.discountPrice.toLocaleString()}원` : ''}`}
          {p.groupbuyEndsAt && ` · 마감 ${new Date(p.groupbuyEndsAt).toLocaleString('ko-KR')}`}</dd>
        <dt style={{ color: '#888' }}>도매 판매</dt>
        <dd style={{ margin: 0 }}>{p.wholesaleEnabled && p.wholesale ? `${p.wholesale.price.toLocaleString()}원 · 최소 ${p.wholesale.minQty}개 · ${p.wholesale.orderUnit}개 단위 · ${AUDIENCE_LABEL[p.wholesaleAudience]}` : '안 함'}</dd>
        <dt style={{ color: '#888' }}>공급가(사입)</dt>
        <dd style={{ margin: 0 }}>{p.supplyPrice ? `${p.supplyPrice.toLocaleString()}원` : '-'}</dd>
        <dt style={{ color: '#888' }}>희망 발송</dt>
        <dd style={{ margin: 0 }}>{FULFILLMENT_LABEL[p.fulfillment ?? 'vendor']}</dd>
        <dt style={{ color: '#888' }}>옵션</dt>
        <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{optionSummary || '-'}</dd>
        <dt style={{ color: '#888' }}>KC 인증</dt>
        <dd style={{ margin: 0, color: p.data.kcCert ? '#111' : '#c93442', fontWeight: p.data.kcCert ? 400 : 700 }}>{p.data.kcCert || '없음 (아동복은 필수)'}</dd>
      </dl>

      {s.status === 'pending' ? (
        <div style={{ display: 'grid', gap: 10, background: '#faf8f6', borderRadius: 12, padding: 12 }}>
          <b style={{ fontSize: 14 }}>거래 조건 정하기</b>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
            <label htmlFor={`d-${s.id}`} className="visually-hidden">거래 방식</label>
            <select id={`d-${s.id}`} value={deal} onChange={(e) => setDeal(e.target.value as DealType)} style={input}>
              {(['commission', 'purchase'] as DealType[]).map((d) => <option key={d} value={d}>{DEAL_LABEL[d]}</option>)}
            </select>
            {deal === 'commission' && (
              <>
                <label htmlFor={`r-${s.id}`}>수수료</label>
                <input id={`r-${s.id}`} type="number" min={0} max={100} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} style={{ ...input, width: 76 }} />%
                {p.wholesaleEnabled && (
                  <>
                    <label htmlFor={`wr-${s.id}`}>도매 수수료</label>
                    <input id={`wr-${s.id}`} type="number" min={0} max={100} step="0.1" value={wsRate} placeholder="같음" onChange={(e) => setWsRate(e.target.value)} style={{ ...input, width: 76 }} />%
                  </>
                )}
              </>
            )}
            <label htmlFor={`f-${s.id}`} className="visually-hidden">발송</label>
            <select id={`f-${s.id}`} value={fulfillment} onChange={(e) => setFulfillment(e.target.value as Fulfillment)} style={input}>
              {(Object.keys(FULFILLMENT_LABEL) as Fulfillment[]).map((f) => <option key={f} value={f}>{FULFILLMENT_LABEL[f]}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', display: 'grid', gap: 2 }}>
            {preview && p.consumerMode !== 'none' && <span>일반 1개 {price.toLocaleString()}원 → 니니랜드 <b>{preview.nini.toLocaleString()}원</b> · 도매처 <b>{preview.vendor.toLocaleString()}원</b></span>}
            {wsPreview && p.wholesale && <span>도매 1개 {p.wholesale.price.toLocaleString()}원 → 니니랜드 <b>{wsPreview.nini.toLocaleString()}원</b> · 도매처 <b>{wsPreview.vendor.toLocaleString()}원</b></span>}
            {deal === 'purchase' && !p.supplyPrice && <span style={{ color: '#c93442' }}>사입인데 공급가가 없습니다. 반려하고 공급가를 받아주세요.</span>}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 700 }}>
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            {s.product_id ? '승인하면서 판매 중으로 바꾸기' : '승인하면서 바로 판매 개시'}
          </label>
          <label htmlFor={`n-${s.id}`} className="visually-hidden">메모·반려 사유</label>
          <input id={`n-${s.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="반려 사유 또는 메모 (도매처에게 보임)" style={input} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" style={btn(true)} disabled={busy} onClick={() => void approve()}>승인</button>
            <button type="button" style={{ ...btn(), color: '#c93442' }} disabled={busy} onClick={() => void reject()}>반려</button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: s.status === 'approved' ? '#2f6f4f' : '#888', fontWeight: 700 }}>
          {s.status === 'approved' ? '승인됨' : s.status === 'rejected' ? '반려됨' : '도매처가 취소함'}{s.review_note ? ` · ${s.review_note}` : ''}
        </p>
      )}
    </article>
  );
}
