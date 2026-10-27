'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import { CONSUMER_MODE_LABEL, salePrice, type Product } from '../lib/mockProducts';
import { PRODUCT_COLUMNS, rowToProduct, supabase, type ProductRow } from '../lib/supabase';

interface SubmissionRow {
  id: string;
  product_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  review_note: string | null;
  created_at: string;
  payload: { data: { name: string; image: string } };
}

const STATUS: Record<SubmissionRow['status'], { label: string; color: string }> = {
  pending: { label: '검수 대기', color: '#b26b00' },
  approved: { label: '승인', color: '#2f6f4f' },
  rejected: { label: '반려', color: '#c93442' },
  withdrawn: { label: '취소함', color: '#888' },
};

export default function VendorProductsPage() {
  const { account, groupbuyCounts } = useMockStore();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);

  const load = async () => {
    if (!supabase || !account?.vendor) return;
    const [p, s] = await Promise.all([
      supabase.from('products').select(PRODUCT_COLUMNS).eq('vendor_id', account.vendor.id).order('created_at', { ascending: false }),
      supabase.from('product_submissions').select('id, product_id, status, review_note, created_at, payload').order('created_at', { ascending: false }).limit(100),
    ]);
    setProducts(((p.data ?? []) as unknown as ProductRow[]).map(rowToProduct));
    setSubmissions((s.data ?? []) as SubmissionRow[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.vendor?.id]);

  const withdraw = async (id: string) => {
    if (!supabase) return;
    await supabase.from('product_submissions').update({ status: 'withdrawn' }).eq('id', id);
    await load();
  };

  const pending = submissions.filter((s) => s.status === 'pending');
  const recent = submissions.filter((s) => s.status !== 'pending').slice(0, 10);

  return (
    <main style={{ display: 'grid', gap: 14, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <h1 style={{ fontSize: 22 }}>내 상품</h1>
          <Link href="/vendor/new" style={{ border: 0, borderRadius: 10, padding: '10px 14px', background: '#111', color: '#fff', fontWeight: 800, fontSize: 14 }}>+ 상품 올리기</Link>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>
          새 상품과 수정은 니니랜드 검수 후 반영됩니다. 판매 중인 상품을 고쳐도 승인 전까지는 기존 내용으로 팔려요.
        </p>
      </section>

      {pending.length > 0 && (
        <section style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 8, border: '2px solid #f4d9a6' }}>
          <b>검수 대기 {pending.length}건</b>
          {pending.map((s) => (
            <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: 14 }}>
              <span>{s.payload.data.name} <span style={{ color: '#888', fontSize: 12 }}>{s.product_id ? '수정 신청' : '새 상품'} · {new Date(s.created_at).toLocaleDateString('ko-KR')}</span></span>
              <button type="button" onClick={() => void withdraw(s.id)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', background: '#fff', fontSize: 12 }}>신청 취소</button>
            </div>
          ))}
        </section>
      )}

      {products === null ? null : products.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888', padding: 30 }}>아직 승인된 상품이 없습니다. 첫 상품을 올려보세요.</p>
      ) : (
        products.map((p) => (
          <article key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 12, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.name}
                  <span style={{ fontSize: 11, fontWeight: 800, color: p.active ? '#2f6f4f' : '#888' }}>{p.active ? '판매 중' : '판매 전'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {CONSUMER_MODE_LABEL[p.consumerMode ?? 'retail']}{p.consumerMode !== 'none' && ` ${salePrice(p).toLocaleString()}원`}
                  {p.wholesaleEnabled && ' · 도매 판매'} · 주문 {groupbuyCounts[p.id] ?? 0}개
                </div>
              </div>
            </div>
            <Link href={`/vendor/new?product=${encodeURIComponent(p.id)}`} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 11px', fontSize: 13 }}>수정 신청</Link>
          </article>
        ))
      )}

      {recent.length > 0 && (
        <section style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gap: 6 }}>
          <b style={{ fontSize: 14 }}>최근 검수 결과</b>
          {recent.map((s) => (
            <div key={s.id} style={{ fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: STATUS[s.status].color }}>{STATUS[s.status].label}</span>
              <span>{s.payload.data.name}</span>
              {s.review_note && <span style={{ color: '#666' }}>· {s.review_note}</span>}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
