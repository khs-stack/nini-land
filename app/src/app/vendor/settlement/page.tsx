'use client';

import { SettlementTable } from '../../components/SettlementTable';

export default function VendorSettlementPage() {
  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 6 }}>
        <h1 style={{ fontSize: 22 }}>정산 내역</h1>
        <p style={{ fontSize: 13, color: '#666' }}>
          입금 확인된 주문 기준으로 내 몫이 자동 계산됩니다. 니니랜드가 송금하면 &lsquo;지급 완료&rsquo;에 기록돼요.
        </p>
      </section>
      <SettlementTable mode="vendor" />
    </main>
  );
}
