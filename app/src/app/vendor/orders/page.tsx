'use client';

import { useCallback, useEffect, useState } from 'react';
import { COURIERS, formatPhone, ORDER_STATUS_LABEL, supabase, type OrderStatus } from '../../lib/supabase';
import { downloadCsv } from '../../lib/adminOrders';

interface VendorOrder {
  orderId: string;
  orderNo: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  shipsByMe: boolean;
  recipient: string | null;
  phone: string | null;
  address: string | null;
  memo: string | null;
  courier: string | null;
  trackingNo: string | null;
  shippedAt: string | null;
  shippingFee: number | null;
  items: Array<{ name: string; color: string | null; size: string | null; quantity: number; unitPrice: number; channel: string; vendorShare: number; fulfillment: string }>;
}

type Tab = 'toShip' | 'shipped' | 'waiting' | 'all';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [tab, setTab] = useState<Tab>('toShip');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc('vendor_orders');
    setOrders((data ?? []) as VendorOrder[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const list = (orders ?? []).filter((o) => {
    if (tab === 'toShip') return o.shipsByMe && !o.trackingNo && (o.status === 'paid' || o.status === 'preparing');
    if (tab === 'shipped') return Boolean(o.trackingNo);
    if (tab === 'waiting') return o.status === 'awaiting_deposit';
    return true;
  });
  const toShipCount = (orders ?? []).filter((o) => o.shipsByMe && !o.trackingNo && (o.status === 'paid' || o.status === 'preparing')).length;

  const exportCsv = () => downloadCsv(`발송목록_${new Date().toISOString().slice(0, 10)}.csv`, [
    ['주문번호', '받는분', '연락처', '주소', '배송메모', '상품', '옵션', '수량'],
    ...list.flatMap((o) => o.items.map((i) => [o.orderNo, o.recipient ?? '', o.phone ? formatPhone(o.phone) : '', o.address ?? '', o.memo ?? '', i.name, [i.color, i.size].filter(Boolean).join(' / '), i.quantity])),
  ]);

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 10 }}>
        <h1 style={{ fontSize: 22 }}>주문 · 발송</h1>
        <p style={{ fontSize: 13, color: '#666' }}>
          내 상품이 들어간 주문입니다. 직접 발송하는 주문은 입금이 확인되면 받는 분 정보가 열립니다. 송장을 넣으면 손님 주문 화면에 바로 보여요.
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} role="tablist">
          {([['toShip', `발송할 주문 ${toShipCount ? toShipCount : ''}`], ['shipped', '발송 완료'], ['waiting', '입금 대기'], ['all', '전체']] as Array<[Tab, string]>).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              style={{ border: tab === key ? 0 : '1px solid #ddd', borderRadius: 999, padding: '8px 12px', fontSize: 13, fontWeight: 700, background: tab === key ? '#111' : '#fff', color: tab === key ? '#fff' : '#111' }}>
              {label}
            </button>
          ))}
          {tab === 'toShip' && list.length > 0 && (
            <button type="button" onClick={exportCsv} style={{ marginLeft: 'auto', border: '1px solid #ddd', borderRadius: 10, padding: '8px 12px', background: '#fff', fontSize: 13 }}>발송 목록 엑셀(CSV)</button>
          )}
        </div>
        {toast && <p style={{ background: '#eef8f2', color: '#2f6f4f', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{toast}</p>}
      </section>

      {orders !== null && list.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: 30 }}>해당하는 주문이 없습니다.</p>}
      {list.map((o) => (
        <VendorOrderCard key={o.orderId} o={o} onSaved={(text) => { setToast(text); void load(); }} />
      ))}
    </main>
  );
}

function VendorOrderCard({ o, onSaved }: { o: VendorOrder; onSaved: (text: string) => void }) {
  const [courier, setCourier] = useState(o.courier ?? COURIERS[0].name);
  const [trackingNo, setTrackingNo] = useState(o.trackingNo ?? '');
  const canShip = o.shipsByMe && (o.status === 'paid' || o.status === 'preparing' || o.status === 'shipped');
  const myTotal = o.items.reduce((s, i) => s + i.vendorShare, 0);

  const save = async () => {
    if (!supabase || !trackingNo.trim()) return;
    const { error } = await supabase.rpc('vendor_set_tracking', { p_order: o.orderId, p_courier: courier, p_tracking: trackingNo.trim() });
    onSaved(error ? `저장 실패: ${error.message}` : `${o.orderNo} 송장을 저장했습니다.`);
  };

  return (
    <article style={{ background: '#fff', borderRadius: 16, padding: 14, display: 'grid', gap: 8, border: canShip && !o.trackingNo ? '2px solid #7048e8' : '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <b>{o.orderNo}</b>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#2f6fed' }}>{ORDER_STATUS_LABEL[o.status]}</span>
        <span style={{ fontSize: 12, color: o.shipsByMe ? '#7048e8' : '#888', fontWeight: 700 }}>{o.shipsByMe ? '직접 발송' : '니니랜드 발송'}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{new Date(o.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div style={{ display: 'grid', gap: 3, fontSize: 13 }}>
        {o.items.map((i, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{i.channel === 'wholesale' && <b style={{ color: '#0b7285' }}>[도매] </b>}{i.name} <span style={{ color: '#888' }}>{[i.color, i.size].filter(Boolean).join(' / ')}</span></span>
            <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{i.quantity}개</span>
          </div>
        ))}
        <span style={{ color: '#7048e8', fontWeight: 700 }}>내 몫 {myTotal.toLocaleString()}원{o.shipsByMe && o.shippingFee ? ` + 배송비 ${o.shippingFee.toLocaleString()}원` : ''}</span>
      </div>
      {o.recipient && (
        <div style={{ background: '#faf8f6', borderRadius: 10, padding: 10, fontSize: 13, display: 'grid', gap: 2 }}>
          <b>{o.recipient} · {o.phone ? formatPhone(o.phone) : ''}</b>
          <span>{o.address}</span>
          {o.memo && <span style={{ color: '#666' }}>메모: {o.memo}</span>}
        </div>
      )}
      {canShip && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <label htmlFor={`vc-${o.orderId}`} className="visually-hidden">택배사</label>
          <select id={`vc-${o.orderId}`} value={courier} onChange={(e) => setCourier(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 8, fontSize: 14 }}>
            {COURIERS.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
          <label htmlFor={`vt-${o.orderId}`} className="visually-hidden">송장번호</label>
          <input id={`vt-${o.orderId}`} value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="송장번호" inputMode="numeric"
            style={{ flex: '1 1 140px', border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 14, minWidth: 0 }} />
          <button type="button" onClick={() => void save()} disabled={!trackingNo.trim()}
            style={{ border: 0, borderRadius: 10, padding: '9px 12px', background: '#111', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {o.trackingNo ? '송장 수정' : '발송 처리'}
          </button>
        </div>
      )}
      {o.shipsByMe && o.status === 'awaiting_deposit' && <p style={{ fontSize: 12, color: '#888' }}>입금이 확인되면 받는 분 정보가 열립니다.</p>}
    </article>
  );
}
