'use client';

import { useCallback, useEffect, useState } from 'react';
import { downloadCsv } from '../lib/adminOrders';
import { supabase } from '../lib/supabase';

export interface SettlementRow {
  vendorId: string | null;
  vendorName: string;
  bank: string | null;
  sales: number;
  retailSales: number;
  groupbuySales: number;
  wholesaleSales: number;
  vendorShare: number;
  niniShare: number;
  shippingFee: number;
  payable: number;
  paid: number;
}

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(start), to: fmt(end) };
}

const won = (n: number) => `${Math.round(n).toLocaleString()}원`;
const cell = { padding: '8px 6px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const };

/**
 * 입금 확인일 기준 기간 정산표. 관리자는 전체 도매처, 도매처는 자기 것만 (서버 settlement_summary가 거름).
 */
export function SettlementTable({ mode }: { mode: 'admin' | 'vendor' }) {
  const [range, setRange] = useState(monthRange(0));
  const [rows, setRows] = useState<SettlementRow[] | null>(null);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMemo, setPayMemo] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    setError('');
    const { data, error: rpcError } = await supabase.rpc('settlement_summary', { p_from: range.from, p_to: range.to });
    if (rpcError) {
      setError(rpcError.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as SettlementRow[]);
  }, [range]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const savePayout = async (row: SettlementRow) => {
    if (!supabase || !row.vendorId) return;
    const amount = Math.round(Number(payAmount));
    if (!amount) return;
    const { error: insertError } = await supabase.from('vendor_payouts').insert({
      vendor_id: row.vendorId, period_start: range.from, period_end: range.to, amount, memo: payMemo.trim() || null,
    });
    setToast(insertError ? `저장 실패: ${insertError.message}` : `${row.vendorName}에 ${won(amount)} 송금 완료로 기록했습니다.`);
    setPayingId(null);
    await load();
  };

  const totals = (rows ?? []).reduce(
    (acc, r) => ({ sales: acc.sales + r.sales, nini: acc.nini + r.niniShare, payable: acc.payable + r.payable, paid: acc.paid + r.paid }),
    { sales: 0, nini: 0, payable: 0, paid: 0 }
  );

  const exportCsv = () => downloadCsv(`니니랜드_정산_${range.from}_${range.to}.csv`, [
    ['판매처', '총 판매', '개인판매', '공구', '도매', '도매처 몫', '니니랜드 몫', '배송비(발송처 몫)', '지급할 금액', '지급 완료', '남은 금액', '정산 계좌'],
    ...(rows ?? []).map((r) => [r.vendorName, r.sales, r.retailSales, r.groupbuySales, r.wholesaleSales, r.vendorShare, r.niniShare, r.shippingFee, r.payable, r.paid, r.payable - r.paid, r.bank ?? '']),
  ]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 14 }}>
          <label htmlFor="st-from" className="visually-hidden">시작일</label>
          <input id="st-from" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 8 }} />
          ~
          <label htmlFor="st-to" className="visually-hidden">종료일</label>
          <input id="st-to" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 8 }} />
          <button type="button" onClick={() => setRange(monthRange(0))} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', background: '#fff' }}>이번 달</button>
          <button type="button" onClick={() => setRange(monthRange(-1))} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', background: '#fff' }}>지난 달</button>
          {mode === 'admin' && <button type="button" onClick={exportCsv} disabled={!rows?.length} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', background: '#fff', marginLeft: 'auto' }}>엑셀(CSV)</button>}
        </div>
        <p style={{ fontSize: 12, color: '#888' }}>입금 확인된 주문 기준(취소 제외). 배송비는 발송한 곳의 몫으로 계산합니다.</p>
        {mode === 'admin' && rows && rows.length > 0 && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
            <span>총 판매 <b>{won(totals.sales)}</b></span>
            <span>니니랜드 몫 <b style={{ color: '#2f6f4f' }}>{won(totals.nini)}</b></span>
            <span>도매처에 줄 돈 <b>{won(totals.payable)}</b> (지급 {won(totals.paid)})</span>
          </div>
        )}
        {error && <p style={{ color: '#c93442', fontSize: 13 }}>{error}</p>}
        {toast && <p style={{ color: '#2f6f4f', fontSize: 13, fontWeight: 700 }}>{toast}</p>}
      </section>

      {rows && rows.length === 0 && !error && <p style={{ textAlign: 'center', color: '#888', padding: 24 }}>이 기간에 정산할 주문이 없습니다.</p>}

      {rows?.map((r) => {
        const remaining = r.payable - r.paid;
        return (
          <section key={r.vendorId ?? 'nini'} style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 10, border: r.vendorId && remaining > 0 ? '2px solid #7048e8' : '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <b style={{ fontSize: 16 }}>{r.vendorName}</b>
              {r.bank && <span style={{ fontSize: 12, color: '#888' }}>{r.bank}</span>}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                <tbody>
                  <tr><td style={{ padding: '6px', color: '#666' }}>총 판매</td><td style={cell}>{won(r.sales)}</td></tr>
                  <tr><td style={{ padding: '6px', color: '#999', paddingLeft: 16 }}>개인판매 · 공구 · 도매</td><td style={{ ...cell, color: '#999' }}>{won(r.retailSales)} · {won(r.groupbuySales)} · {won(r.wholesaleSales)}</td></tr>
                  {r.vendorId && <tr><td style={{ padding: '6px', color: '#666' }}>도매처 몫 (상품)</td><td style={cell}>{won(r.vendorShare)}</td></tr>}
                  {r.vendorId && <tr><td style={{ padding: '6px', color: '#666' }}>+ 배송비 (직접 발송분)</td><td style={cell}>{won(r.shippingFee)}</td></tr>}
                  {!r.vendorId && <tr><td style={{ padding: '6px', color: '#666' }}>배송비 수입 (니니랜드 발송분)</td><td style={cell}>{won(r.shippingFee)}</td></tr>}
                  {mode === 'admin' && <tr><td style={{ padding: '6px', color: '#2f6f4f', fontWeight: 700 }}>니니랜드 몫</td><td style={{ ...cell, color: '#2f6f4f', fontWeight: 700 }}>{won(r.niniShare)}</td></tr>}
                  {r.vendorId && (
                    <>
                      <tr style={{ borderTop: '1px solid #eee' }}><td style={{ padding: '6px', fontWeight: 800 }}>{mode === 'admin' ? '지급할 금액' : '받을 금액'}</td><td style={{ ...cell, fontWeight: 800 }}>{won(r.payable)}</td></tr>
                      <tr><td style={{ padding: '6px', color: '#666' }}>지급 완료</td><td style={cell}>{won(r.paid)}</td></tr>
                      <tr><td style={{ padding: '6px', fontWeight: 800, color: remaining > 0 ? '#7048e8' : '#2f6f4f' }}>남은 금액</td><td style={{ ...cell, fontWeight: 800, color: remaining > 0 ? '#7048e8' : '#2f6f4f' }}>{won(remaining)}</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            {mode === 'admin' && r.vendorId && remaining > 0 && (
              payingId === r.vendorId ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <label htmlFor={`pay-${r.vendorId}`} className="visually-hidden">송금액</label>
                  <input id={`pay-${r.vendorId}`} type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 8, width: 130 }} />
                  <label htmlFor={`memo-${r.vendorId}`} className="visually-hidden">메모</label>
                  <input id={`memo-${r.vendorId}`} value={payMemo} onChange={(e) => setPayMemo(e.target.value)} placeholder="메모 (선택)" style={{ border: '1px solid #ddd', borderRadius: 10, padding: 8, flex: '1 1 120px', minWidth: 0 }} />
                  <button type="button" onClick={() => void savePayout(r)} style={{ border: 0, borderRadius: 10, padding: '8px 12px', background: '#7048e8', color: '#fff', fontWeight: 700 }}>송금 완료 기록</button>
                  <button type="button" onClick={() => setPayingId(null)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 12px', background: '#fff' }}>취소</button>
                </div>
              ) : (
                <button type="button" onClick={() => { setPayingId(r.vendorId); setPayAmount(String(remaining)); setPayMemo(''); }}
                  style={{ justifySelf: 'start', border: '1px solid #d0bfff', color: '#7048e8', borderRadius: 10, padding: '8px 12px', background: '#fff', fontWeight: 700 }}>
                  송금했어요
                </button>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}
