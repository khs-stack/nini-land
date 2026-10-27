'use client';

import { SettlementTable } from '../../components/SettlementTable';
import { useMockStore } from '../../lib/mockStore';

export default function AdminSettlementPage() {
  const { isAdmin } = useMockStore();
  if (!isAdmin) return null;
  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 6 }}>
        <h1 style={{ fontSize: 22 }}>정산</h1>
        <p style={{ fontSize: 13, color: '#666' }}>
          주문마다 거래 방식(수수료·사입·자체)에 따라 니니랜드 몫과 도매처 몫이 자동으로 나뉩니다. 도매처에 송금한 뒤 &lsquo;송금했어요&rsquo;로 기록하세요.
        </p>
      </section>
      <SettlementTable mode="admin" />
    </main>
  );
}
