'use client';

import { useEffect, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { supabase } from '../lib/supabase';

interface VendorInfo {
  companyName: string;
  representative: string | null;
  businessNumber: string;
  mailOrderNumber: string | null;
  address: string | null;
  phone: string | null;
}

/**
 * 입점 도매처 상품의 판매자 정보 (전자상거래법 제20조: 통신판매중개자는 판매자 정보를 표시하고
 * 자신이 거래 당사자가 아님을 알려야 한다).
 */
export function VendorDisclosure({ vendorId }: { vendorId: string }) {
  const { settings } = useMockStore();
  const [info, setInfo] = useState<VendorInfo | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.rpc('vendor_public_info', { p_vendor: vendorId }).then(({ data }) => {
      if (alive && data) setInfo(data as VendorInfo);
    });
    return () => {
      alive = false;
    };
  }, [vendorId]);

  if (!info) return null;
  const rows: Array<[string, string | null]> = [
    ['상호', info.companyName],
    ['대표자', info.representative],
    ['사업자등록번호', info.businessNumber],
    ['통신판매업 신고번호', info.mailOrderNumber],
    ['사업장 주소', info.address],
    ['연락처', info.phone],
  ];

  return (
    <section style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #eee', display: 'grid', gap: 8, fontSize: 13 }} aria-label="판매자 정보">
      <b style={{ fontSize: 14 }}>판매자 정보</b>
      <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 8em) minmax(0, 1fr)', gap: '4px 10px', margin: 0 }}>
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt style={{ color: '#888' }}>{label}</dt>
            <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{value}</dd>
          </div>
        ))}
      </dl>
      <p style={{ color: '#888', fontSize: 12, lineHeight: 1.5 }}>
        {settings.companyName || '니니랜드'}는 통신판매중개자로서 이 상품의 거래 당사자가 아니며, 상품 정보와 거래에 대한 책임은 판매자에게 있습니다.
        다만 주문·결제·고객 문의는 니니랜드가 함께 접수해 처리합니다.
      </p>
    </section>
  );
}
