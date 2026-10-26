'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import {
  downloadCsv,
  fetchAdminOrders,
  optionLabel,
  patchOrder,
  setOrderStatus,
  type AdminOrder,
} from '../../lib/adminOrders';
import { COURIERS, formatPhone, ORDER_STATUS_LABEL, type OrderStatus } from '../../lib/supabase';

type Tab = OrderStatus | 'cancel_requested' | 'all';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'awaiting_deposit', label: '입금 대기' },
  { key: 'paid', label: '입금 확인' },
  { key: 'preparing', label: '발주·준비' },
  { key: 'shipped', label: '배송중' },
  { key: 'delivered', label: '완료' },
  { key: 'cancel_requested', label: '취소 요청' },
  { key: 'cancelled', label: '취소' },
  { key: 'all', label: '전체' },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  awaiting_deposit: '#b26b00',
  paid: '#2f6fed',
  preparing: '#7048e8',
  shipped: '#0b7285',
  delivered: '#2f6f4f',
  cancelled: '#888',
};

const btn = (primary = false) => ({
  border: primary ? 0 : '1px solid #ddd',
  borderRadius: 10,
  padding: '9px 12px',
  background: primary ? '#111' : '#fff',
  color: primary ? '#fff' : '#111',
  fontSize: 13,
  fontWeight: 700,
}) as const;

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
}

export default function AdminOrdersPage() {
  const { isAdmin, refreshCatalog } = useMockStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('awaiting_deposit');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAdminOrders();
    setOrders(result.orders);
    setError(result.error ?? '');
    setLoading(false);
  }, []);

  useEffect(() => {
    // 관리자 로그인 후 주문 목록을 DB에서 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length, cancel_requested: 0 };
    for (const order of orders) {
      result[order.status] = (result[order.status] ?? 0) + 1;
      if (order.cancel_requested_at && order.status !== 'cancelled') result.cancel_requested += 1;
    }
    return result;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().replace(/-/g, '').toLowerCase();
    return orders.filter((order) => {
      if (tab === 'cancel_requested' ? !(order.cancel_requested_at && order.status !== 'cancelled') : tab !== 'all' && order.status !== tab) return false;
      if (!q) return true;
      return [order.order_no.replace(/-/g, ''), order.recipient, order.phone, order.depositor_name, order.address]
        .some((value) => value.toLowerCase().replace(/-/g, '').includes(q));
    });
  }, [orders, tab, query]);

  const visibleTotal = visible.reduce((sum, order) => sum + order.total, 0);

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2500);
  };

  const changeStatus = async (ids: string[], status: OrderStatus, extra: Partial<AdminOrder> = {}) => {
    const { error: updateError } = await setOrderStatus(ids, status, extra);
    if (updateError) {
      flash(`저장하지 못했습니다: ${updateError}`);
      return;
    }
    flash(`${ids.length}건을 '${ORDER_STATUS_LABEL[status]}'(으)로 바꿨습니다.`);
    setSelected([]);
    await load();
    void refreshCatalog();
  };

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [['주문번호', '주문일시', '상태', '받는분', '연락처', '주소', '배송메모', '입금자명', '상품', '옵션', '수량', '단가', '주문합계', '택배사', '송장번호']];
    for (const order of visible) {
      for (const item of order.order_items) {
        rows.push([order.order_no, new Date(order.created_at).toLocaleString('ko-KR'), ORDER_STATUS_LABEL[order.status], order.recipient,
          formatPhone(order.phone), order.address, order.memo ?? '', order.depositor_name, item.product_name, optionLabel(item),
          item.quantity, item.unit_price, order.total, order.courier ?? '', order.tracking_no ?? '']);
      }
    }
    downloadCsv(`니니랜드_주문_${TABS.find((t) => t.key === tab)?.label}_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  if (!isAdmin) return null;

  const bulkActions: Partial<Record<Tab, { label: string; status: OrderStatus }>> = {
    awaiting_deposit: { label: '선택 입금 확인', status: 'paid' },
    paid: { label: '선택 발주 완료', status: 'preparing' },
    shipped: { label: '선택 배송 완료', status: 'delivered' },
  };
  const bulk = bulkActions[tab];

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <h1 style={{ fontSize: 22 }}>주문 · 입금 관리</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" style={btn()} onClick={() => void load()}>{loading ? '불러오는 중…' : '새로고침'}</button>
            <button type="button" style={btn()} onClick={exportCsv} disabled={!visible.length}>엑셀(CSV) 받기</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }} role="tablist">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); setSelected([]); }}
              style={{ ...btn(tab === t.key), whiteSpace: 'nowrap', borderRadius: 999 }}>
              {t.label} {counts[t.key] ? <b style={{ color: tab === t.key ? '#ffd76b' : '#c93442' }}>{counts[t.key]}</b> : null}
            </button>
          ))}
        </div>
        <input id="order-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="주문번호 · 이름 · 연락처 · 입금자명으로 검색"
          style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: '#666' }}>
          <span>{visible.length}건 · 합계 {visibleTotal.toLocaleString()}원</span>
          {bulk && visible.length > 0 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="checkbox" checked={selected.length === visible.length} onChange={(e) => setSelected(e.target.checked ? visible.map((o) => o.id) : [])} />
                전체 선택
              </label>
              <button type="button" style={btn(true)} disabled={!selected.length} onClick={() => void changeStatus(selected, bulk.status)}>
                {bulk.label} ({selected.length})
              </button>
            </div>
          )}
        </div>
        {error && <p style={{ color: '#c93442', fontSize: 13 }}>주문을 불러오지 못했습니다: {error}</p>}
        {toast && <p style={{ background: '#eef8f2', color: '#2f6f4f', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{toast}</p>}
      </section>

      {!loading && visible.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', padding: 30 }}>
          {tab === 'awaiting_deposit' ? '입금을 기다리는 주문이 없습니다.' : '해당하는 주문이 없습니다.'}
        </p>
      )}

      {visible.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          open={openId === order.id}
          onToggle={() => setOpenId(openId === order.id ? null : order.id)}
          selectable={Boolean(bulk)}
          selected={selected.includes(order.id)}
          onSelect={(checked) => setSelected((cur) => (checked ? [...cur, order.id] : cur.filter((id) => id !== order.id)))}
          onStatus={(status, extra) => void changeStatus([order.id], status, extra)}
          onSaved={(text) => { flash(text); void load(); }}
        />
      ))}
    </main>
  );
}

function OrderCard({
  order, open, onToggle, selectable, selected, onSelect, onStatus, onSaved,
}: {
  order: AdminOrder;
  open: boolean;
  onToggle: () => void;
  selectable: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onStatus: (status: OrderStatus, extra?: Partial<AdminOrder>) => void;
  onSaved: (text: string) => void;
}) {
  const [courier, setCourier] = useState(order.courier ?? COURIERS[0].name);
  const [trackingNo, setTrackingNo] = useState(order.tracking_no ?? '');
  const [memo, setMemo] = useState(order.admin_memo ?? '');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const cancelRequested = Boolean(order.cancel_requested_at && order.status !== 'cancelled');

  const saveMemo = async () => {
    const { error } = await patchOrder(order.id, { admin_memo: memo.trim() || null });
    onSaved(error ? `메모 저장 실패: ${error}` : '메모를 저장했습니다.');
  };

  const ship = () => {
    if (!trackingNo.trim()) return;
    onStatus('shipped', { courier, tracking_no: trackingNo.trim() });
  };

  return (
    <article style={{ background: '#fff', borderRadius: 16, padding: 14, border: cancelRequested ? '2px solid #c93442' : selected ? '2px solid #111' : '1px solid #eee', display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {selectable && (
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`${order.order_no} 선택`} style={{ marginTop: 4, width: 18, height: 18 }} />
        )}
        <button type="button" onClick={onToggle} style={{ flex: 1, textAlign: 'left', border: 0, background: 'none', padding: 0, display: 'grid', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: 15 }}>{order.recipient}</strong>
            <span style={{ fontSize: 12, fontWeight: 800, color: STATUS_COLOR[order.status] }}>{ORDER_STATUS_LABEL[order.status]}</span>
            {cancelRequested && <span style={{ fontSize: 12, fontWeight: 800, color: '#c93442' }}>취소 요청</span>}
            <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto' }}>{fmtDate(order.created_at)}</span>
          </div>
          <div style={{ fontSize: 13, color: '#555' }}>
            <b style={{ fontSize: 15, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{order.total.toLocaleString()}원</b>
            {' · '}입금자 <b>{order.depositor_name}</b>{' · '}{itemCount}개 · {order.order_no}
          </div>
          <div style={{ fontSize: 12, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.order_items.map((item) => `${item.product_name}(${optionLabel(item)})×${item.quantity}`).join(', ')}
          </div>
        </button>
      </div>

      {open && (
        <div style={{ display: 'grid', gap: 10, borderTop: '1px solid #f0ece8', paddingTop: 10, fontSize: 13 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            {order.order_items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{item.product_name} <span style={{ color: '#888' }}>{optionLabel(item)}</span></span>
                <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}개 · {(item.unit_price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
              <span>배송비</span><span>{order.shipping_fee ? `${order.shipping_fee.toLocaleString()}원` : '무료'}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 3, background: '#faf8f6', borderRadius: 10, padding: 10 }}>
            <div><a href={`tel:${order.phone}`} style={{ fontWeight: 700 }}>{formatPhone(order.phone)}</a></div>
            <div>{order.address}</div>
            {order.memo && <div style={{ color: '#666' }}>메모: {order.memo}</div>}
            {cancelRequested && <div style={{ color: '#c93442', fontWeight: 700 }}>취소 사유: {order.cancel_reason || '없음'} ({fmtDate(order.cancel_requested_at)})</div>}
            {order.paid_at && <div style={{ color: '#888' }}>입금 확인 {fmtDate(order.paid_at)}</div>}
            {order.tracking_no && <div style={{ color: '#888' }}>{order.courier} {order.tracking_no}</div>}
          </div>

          {(order.status === 'preparing' || order.status === 'paid' || order.status === 'shipped') && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <label htmlFor={`courier-${order.id}`} className="visually-hidden">택배사</label>
              <select id={`courier-${order.id}`} value={courier} onChange={(e) => setCourier(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px', fontSize: 14 }}>
                {COURIERS.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
              <label htmlFor={`tracking-${order.id}`} className="visually-hidden">송장번호</label>
              <input id={`tracking-${order.id}`} value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="송장번호" inputMode="numeric"
                style={{ flex: '1 1 140px', border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 14 }} />
              <button type="button" style={btn(true)} disabled={!trackingNo.trim()} onClick={ship}>
                {order.status === 'shipped' ? '송장 수정' : '발송 처리'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <label htmlFor={`memo-${order.id}`} className="visually-hidden">관리자 메모</label>
            <input id={`memo-${order.id}`} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="관리자 메모 (손님에게 안 보임)"
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 14, minWidth: 0 }} />
            <button type="button" style={btn()} onClick={() => void saveMemo()}>저장</button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {order.status === 'awaiting_deposit' && <button type="button" style={btn(true)} onClick={() => onStatus('paid')}>입금 확인</button>}
            {order.status === 'paid' && <button type="button" style={btn(true)} onClick={() => onStatus('preparing')}>발주 완료</button>}
            {order.status === 'paid' && <button type="button" style={btn()} onClick={() => onStatus('awaiting_deposit')}>입금 확인 취소</button>}
            {order.status === 'shipped' && <button type="button" style={btn(true)} onClick={() => onStatus('delivered')}>배송 완료</button>}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button type="button" onClick={() => (confirmCancel ? onStatus('cancelled') : setConfirmCancel(true))}
                style={{ ...btn(), color: '#c93442', borderColor: '#f1c0c4' }}>
                {confirmCancel ? (order.status === 'awaiting_deposit' ? '정말 취소' : '환불 후 취소 확정') : '주문 취소'}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
