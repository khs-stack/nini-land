'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** 배송 조회는 주문 조회 화면에서 송장번호·택배사 링크로 안내한다. */
export default function ShippingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/orders/lookup');
  }, [router]);
  return <main style={{ padding: 24, color: '#888' }}>주문 조회 화면으로 이동합니다…</main>;
}
