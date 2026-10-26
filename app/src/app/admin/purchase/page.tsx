'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { downloadCsv, fetchAdminOrders, setOrderStatus, type AdminOrder } from '../../lib/adminOrders';

interface Line {
  productId: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
}

const btn = (primary = false) => ({
  border: primary ? 0 : '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 13px',
  background: primary ? '#111' : '#fff',
  color: primary ? '#fff' : '#111',
  fontSize: 13,
  fontWeight: 700,
}) as const;

export default function AdminPurchasePage() {
  const { isAdmin, products } = useMockStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeUnpaid, setIncludeUnpaid] = useState(false);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAdminOrders();
    setOrders(result.orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load();
  }, [isAdmin, load]);

  // 발주 대상: 입금 확인된 주문(+선택 시 입금 대기). 취소 요청 건은 뺀다.
  const targetOrders = useMemo(
    () => orders.filter((o) => (o.status === 'paid' || (includeUnpaid && o.status === 'awaiting_deposit')) && !o.cancel_requested_at),
    [orders, includeUnpaid]
  );

  const productIds = useMemo(
    () => Array.from(new Set(targetOrders.flatMap((o) => o.order_items.map((i) => i.product_id)))),
    [targetOrders]
  );

  const lines = useMemo(() => {
    const map = new Map<string, Line>();
    for (const order of targetOrders) {
      for (const item of order.order_items) {
        if (productFilter !== 'all' && item.product_id !== productFilter) continue;
        const key = [item.product_id, item.color ?? '', item.size ?? ''].join('|');
        const current = map.get(key) ?? { productId: item.product_id, productName: item.product_name, color: item.color ?? '', size: item.size ?? '', quantity: 0 };
        current.quantity += item.quantity;
        map.set(key, current);
      }
    }
    // 상품 → 컬러 → 사이즈(상품에 등록된 사이즈 순서) 순으로 정렬
    const sizeOrder = (productId: string, color: string, size: string) => {
      const option = products.find((p) => p.id === productId)?.options?.find((o) => o.color === color);
      const index = option?.sizes.findIndex((s) => s.size === size) ?? -1;
      return index < 0 ? 999 : index;
    };
    return Array.from(map.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName, 'ko') || a.color.localeCompare(b.color, 'ko') || sizeOrder(a.productId, a.color, a.size) - sizeOrder(b.productId, b.color, b.size)
    );
  }, [targetOrders, productFilter, products]);

  const byProduct = useMemo(() => {
    const groups = new Map<string, Line[]>();
    for (const line of lines) groups.set(line.productId, [...(groups.get(line.productId) ?? []), line]);
    return Array.from(groups.entries());
  }, [lines]);

  const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0);
  const costOf = (productId: string) => products.find((p) => p.id === productId)?.wholesalePrice ?? 0;
  const totalCost = lines.reduce((sum, l) => sum + costOf(l.productId) * l.quantity, 0);
  const relatedOrders = targetOrders.filter((o) => productFilter === 'all' || o.order_items.some((i) => i.product_id === productFilter));
  const paidRelated = relatedOrders.filter((o) => o.status === 'paid');

  const orderText = useMemo(() => {
    const today = new Date().toLocaleDateString('ko-KR');
    const parts = [`[니니랜드 발주] ${today}`];
    for (const [, group] of byProduct) {
      parts.push('', `■ ${group[0].productName}`);
      for (const line of group) parts.push(`- ${[line.color, line.size].filter(Boolean).join(' / ') || '단일옵션'} : ${line.quantity}개`);
      parts.push(`  소계 ${group.reduce((s, l) => s + l.quantity, 0)}개`);
    }
    parts.push('', `총 ${totalQty}개`);
    return parts.join('\n');
  }, [byProduct, totalQty]);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setMessage('발주 내용을 복사했습니다. 카톡에 붙여넣으면 됩니다.');
    } catch {
      setMessage('복사가 막혀 있습니다. 아래 글상자를 길게 눌러 직접 복사해주세요.');
    }
  };

  const markOrdered = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    const { error } = await setOrderStatus(paidRelated.map((o) => o.id), 'preparing');
    setMessage(error ? `저장하지 못했습니다: ${error}` : `${paidRelated.length}건을 '발주·상품 준비중'으로 바꿨습니다.`);
    await load();
  };

  if (!isAdmin) return null;

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: 22 }}>도매처 발주 합계</h1>
        <p style={{ fontSize: 13, color: '#666' }}>
          입금 확인된 주문을 상품·컬러·사이즈별로 합쳤습니다. 도매처에 주문한 뒤 &lsquo;발주 완료로 표시&rsquo;를 누르면 다음 발주에서 빠집니다.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label htmlFor="purchase-product" className="visually-hidden">상품 선택</label>
          <select id="purchase-product" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '9px', fontSize: 14, maxWidth: '100%' }}>
            <option value="all">전체 상품</option>
            {productIds.map((id) => (
              <option key={id} value={id}>{products.find((p) => p.id === id)?.name ?? targetOrders.flatMap((o) => o.order_items).find((i) => i.product_id === id)?.product_name}</option>
            ))}
          </select>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
            <input id="purchase-unpaid" type="checkbox" checked={includeUnpaid} onChange={(e) => setIncludeUnpaid(e.target.checked)} />
            입금 대기 주문도 포함 (미리 보기용)
          </label>
          <button type="button" style={btn()} onClick={() => void load()}>{loading ? '불러오는 중…' : '새로고침'}</button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
          <span>주문 <b>{relatedOrders.length}</b>건</span>
          <span>총 <b>{totalQty}</b>개</span>
          {totalCost > 0 && <span>예상 도매 원가 <b>{totalCost.toLocaleString()}원</b></span>}
        </div>
      </section>

      {!loading && lines.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', padding: 30 }}>발주할 주문이 없습니다. 입금 확인된 주문이 생기면 여기에 모입니다.</p>
      )}

      {byProduct.map(([productId, group]) => (
        <section key={productId} style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <h2 style={{ fontSize: 16 }}>{group[0].productName}</h2>
            <b style={{ fontVariantNumeric: 'tabular-nums' }}>{group.reduce((s, l) => s + l.quantity, 0)}개</b>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr style={{ color: '#888', fontSize: 12, textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>컬러</th><th style={{ padding: '6px 4px' }}>사이즈</th><th style={{ padding: '6px 4px', textAlign: 'right' }}>수량</th>
                </tr>
              </thead>
              <tbody>
                {group.map((line) => (
                  <tr key={`${line.color}-${line.size}`} style={{ borderTop: '1px solid #f0ece8' }}>
                    <td style={{ padding: '7px 4px' }}>{line.color || '-'}</td>
                    <td style={{ padding: '7px 4px' }}>{line.size || '-'}</td>
                    <td style={{ padding: '7px 4px', textAlign: 'right', fontWeight: 800 }}>{line.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {lines.length > 0 && (
        <section style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
          <h2 style={{ fontSize: 16 }}>도매처에 보낼 글</h2>
          <label htmlFor="purchase-text" className="visually-hidden">발주 글</label>
          <textarea id="purchase-text" readOnly value={orderText} style={{ minHeight: 180, border: '1px solid #ddd', borderRadius: 12, padding: 12, fontSize: 13, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" style={btn(true)} onClick={() => void copyText()}>발주 글 복사</button>
            <button type="button" style={btn()} onClick={() => downloadCsv(`니니랜드_발주_${new Date().toISOString().slice(0, 10)}.csv`, [
              ['상품', '컬러', '사이즈', '수량', '도매단가', '금액'],
              ...lines.map((l) => [l.productName, l.color, l.size, l.quantity, costOf(l.productId), costOf(l.productId) * l.quantity]),
            ])}>엑셀(CSV) 받기</button>
            {paidRelated.length > 0 && (
              <button type="button" style={{ ...btn(), color: '#7048e8', borderColor: '#d0bfff' }} onClick={() => void markOrdered()}>
                {confirming ? `입금확인 ${paidRelated.length}건을 발주 완료로 바꿀까요? 한 번 더 누르기` : '발주 완료로 표시'}
              </button>
            )}
          </div>
          {message && <p style={{ fontSize: 13, color: '#2f6f4f', fontWeight: 700 }}>{message}</p>}
        </section>
      )}
    </main>
  );
}
