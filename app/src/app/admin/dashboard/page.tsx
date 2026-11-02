'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { isStoreOpen } from '../../lib/mockSettings';
import { isGroupbuyClosed } from '../../lib/mockProducts';
import { fetchAdminOrders, type AdminOrder } from '../../lib/adminOrders';
import { supabase } from '../../lib/supabase';
import { VENDOR_MARKETPLACE_ENABLED } from '../../lib/mockSettings';

const card = { background: '#fff', borderRadius: 18, padding: 16, display: 'grid', gap: 6, color: 'inherit', textDecoration: 'none' } as const;

export default function AdminDashboard() {
  const { isAdmin, products, settings } = useMockStore();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [pending, setPending] = useState({ vendors: 0, business: 0, submissions: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    void fetchAdminOrders().then((result) => setOrders(result.orders));
    const client = supabase;
    if (!client) return;
    void Promise.all([
      client.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('business_accounts').select('user_id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('product_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([v, b, s]) => setPending({ vendors: v.count ?? 0, business: b.count ?? 0, submissions: s.count ?? 0 }));
  }, [isAdmin]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    const todayKey = new Date().toDateString();
    const live = list.filter((o) => o.status !== 'cancelled');
    return {
      awaiting: list.filter((o) => o.status === 'awaiting_deposit'),
      paid: list.filter((o) => o.status === 'paid').length,
      toShip: list.filter((o) => o.status === 'preparing').length,
      cancelReq: list.filter((o) => o.cancel_requested_at && o.status !== 'cancelled').length,
      today: list.filter((o) => new Date(o.created_at).toDateString() === todayKey).length,
      confirmedSales: live.filter((o) => o.status !== 'awaiting_deposit').reduce((s, o) => s + o.total, 0),
    };
  }, [orders]);

  if (!isAdmin) return null;

  const open = isStoreOpen(settings);
  const liveProducts = products.filter((p) => p.active !== false && !isGroupbuyClosed(p));
  const noKc = products.filter((p) => p.active !== false && !p.kcCert);

  const tiles = [
    { label: '입금 대기', value: stats.awaiting.length, sub: stats.awaiting.length ? `${stats.awaiting.reduce((s, o) => s + o.total, 0).toLocaleString()}원 확인 필요` : '확인할 입금 없음', href: '/admin/orders', alert: stats.awaiting.length > 0 },
    { label: '발주할 주문', value: stats.paid, sub: '입금 확인 완료', href: '/admin/purchase', alert: stats.paid > 0 },
    { label: '발송할 주문', value: stats.toShip, sub: '송장 입력 대기', href: '/admin/orders', alert: false },
    { label: '취소 요청', value: stats.cancelReq, sub: '환불 확인 필요', href: '/admin/orders', alert: stats.cancelReq > 0 },
    ...(VENDOR_MARKETPLACE_ENABLED ? [{ label: '상품 검수', value: pending.submissions, sub: '도매처가 올린 상품', href: '/admin/review', alert: pending.submissions > 0 }] : []),
    { label: '사업자 가입 승인', value: VENDOR_MARKETPLACE_ENABLED ? pending.vendors + pending.business : pending.business, sub: '사업자등록증 확인 대기', href: '/admin/members', alert: pending.business > 0 },
  ];

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ ...card, border: open ? '1px solid #cfe8da' : '2px solid #c93442' }}>
        <h1 style={{ fontSize: 22 }}>오늘의 니니랜드</h1>
        <p style={{ fontSize: 14, color: open ? '#2f6f4f' : '#c93442', fontWeight: 700 }}>
          {open ? '● 주문 받는 중' : '● 주문 닫힘 · 쇼핑몰 설정에서 사업자정보·계좌를 넣고 열어주세요'}
        </p>
        <p style={{ fontSize: 13, color: '#666' }}>
          오늘 주문 {stats.today}건 · 입금 확인된 매출 {stats.confirmedSales.toLocaleString()}원 · 판매 중 상품 {liveProducts.length}개
        </p>
        {!open && <Link href="/admin/settings" style={{ fontWeight: 800, color: '#c93442' }}>쇼핑몰 설정으로 →</Link>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} style={{ ...card, border: tile.alert ? '2px solid #e8590c' : '1px solid #eee' }}>
            <span style={{ fontSize: 13, color: '#666', fontWeight: 700 }}>{tile.label}</span>
            <strong style={{ fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{orders === null ? '–' : tile.value}</strong>
            <span style={{ fontSize: 12, color: '#888' }}>{tile.sub}</span>
          </Link>
        ))}
      </div>

      {noKc.length > 0 && (
        <section style={{ ...card, border: '1px solid #f4d9a6', background: '#fff8ea' }}>
          <b style={{ fontSize: 14, color: '#8a4b00' }}>KC 인증번호가 없는 상품 {noKc.length}개</b>
          <span style={{ fontSize: 13, color: '#6f5a3a' }}>아동복은 KC 인증 표시가 필수입니다. 도매처에 인증번호를 받아 상품 관리에서 넣어주세요.</span>
          <span style={{ fontSize: 12, color: '#8a7a64' }}>{noKc.map((p) => p.name).join(', ')}</span>
        </section>
      )}

      <section style={card}>
        <b style={{ fontSize: 15 }}>운영 순서</b>
        <ol style={{ fontSize: 13, color: '#555', lineHeight: 1.8, paddingLeft: 18 }}>
          <li><Link href="/admin/products">상품 관리</Link>에서 로봇 등록 (상시 판매 / 한정 예약 + 마감일 / 도매가)</li>
          <li><Link href="/admin/members">가입 승인</Link>에서 가게 사장님 사업자등록증 확인 → 승인하면 도매가가 보임</li>
          <li>통장에 입금이 들어오면 <Link href="/admin/orders">주문 · 입금</Link>에서 &lsquo;입금 확인&rsquo;</li>
          <li>예약 마감 후 <Link href="/admin/purchase">생산 · 발주 합계</Link>에서 수량 확인 → 생산·발주 → &lsquo;발주 완료로 표시&rsquo;</li>
          <li>포장하고 송장번호 입력 → &lsquo;발송 처리&rsquo;</li>
        </ol>
      </section>
    </main>
  );
}
