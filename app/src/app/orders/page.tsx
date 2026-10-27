'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { loadSavedOrders, ORDER_STATUS_LABEL, supabase, type OrderStatus, type SavedOrderRef } from '../lib/supabase';

interface MemberOrder extends SavedOrderRef {
  status?: OrderStatus;
  summary?: string;
}

const box = { background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 14px 30px rgba(17,17,17,0.06)' } as const;

export default function OrdersPage() {
  const { account, authChecked } = useMockStore();
  const [saved, setSaved] = useState<MemberOrder[] | null>(null);

  useEffect(() => {
    if (!authChecked) return;
    const local = loadSavedOrders();
    if (supabase && account) {
      // 회원: 계정에 쌓인 주문 + 가입 전 이 기기에서 한 주문
      void supabase.rpc('my_orders').then(({ data }) => {
        const mine = (Array.isArray(data) ? data : []) as MemberOrder[];
        const seen = new Set(mine.map((o) => o.orderNo));
        setSaved([...mine, ...local.filter((o) => !seen.has(o.orderNo))]);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(local);
    }
  }, [account, authChecked]);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 18 }}>
      <section style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24 }}>주문 내역</h1>
          <Link href="/orders/lookup" style={{ color: '#2f6fed', fontSize: 15, fontWeight: 700 }}>주문번호로 조회</Link>
        </div>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          {account ? '내 계정으로 주문한 내역입니다.' : '이 기기에서 주문한 내역입니다. 카카오로 가입하면 다른 폰에서도 볼 수 있어요.'}
        </p>
        {saved === null ? null : saved.length === 0 ? (
          <p style={{ color: '#666', fontSize: 16 }}>이 기기에서 주문한 내역이 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {saved.map((order) => (
              <Link
                key={order.orderNo}
                href={`/orders/${order.orderNo}?phone=${encodeURIComponent(order.phone)}`}
                style={{ border: '1px solid #eee', borderRadius: 16, padding: 16, display: 'grid', gap: 6, color: 'inherit', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 16 }}>주문번호 {order.orderNo}</strong>
                  <span style={{ fontSize: 14, color: '#666' }}>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
                {order.summary && <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.summary}</div>}
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {order.total.toLocaleString()}원
                  {order.status && <span style={{ marginLeft: 8, fontSize: 13, color: '#2f6fed' }}>{ORDER_STATUS_LABEL[order.status]}</span>}
                </div>
                <span style={{ color: '#2f6fed', fontWeight: 700, fontSize: 14 }}>주문 상태 보기 →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
