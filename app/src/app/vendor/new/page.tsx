'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { emptyEditorValue, ProductEditor, productToEditor, type EditorValue } from '../../components/ProductEditor';
import { editorToSubmission, loadPrivateTerms } from '../../lib/productAdmin';
import { PRODUCT_COLUMNS, rowToProduct, supabase, type ProductRow } from '../../lib/supabase';

export default function VendorNewProductPage() {
  return (
    <Suspense fallback={null}>
      <VendorNewInner />
    </Suspense>
  );
}

function VendorNewInner() {
  const params = useSearchParams();
  const productId = params.get('product');
  const { account } = useMockStore();
  const [value, setValue] = useState<EditorValue | null>(productId ? null : { ...emptyEditorValue, fulfillment: 'vendor', dealType: 'commission' });
  const [editorKey, setEditorKey] = useState('new');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!productId || !supabase) return;
    void (async () => {
      const { data } = await supabase!.from('products').select(PRODUCT_COLUMNS).eq('id', productId).maybeSingle();
      if (!data) {
        setMessage({ tone: 'error', text: '수정할 상품을 찾지 못했습니다.' });
        setValue({ ...emptyEditorValue, fulfillment: 'vendor' });
        return;
      }
      const terms = await loadPrivateTerms(productId);
      setValue(productToEditor(rowToProduct(data as unknown as ProductRow), terms));
      setEditorKey(`edit-${productId}`);
    })();
  }, [productId]);

  const submit = async () => {
    if (!supabase || !account?.vendor || !value) return;
    setBusy(true);
    const { error } = await supabase.from('product_submissions').insert({
      vendor_id: account.vendor.id,
      product_id: productId,
      payload: editorToSubmission(value),
      status: 'pending',
    });
    setBusy(false);
    if (error) {
      setMessage({ tone: 'error', text: `신청하지 못했습니다: ${error.message}` });
      return;
    }
    setSent(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!account?.vendor) return null;

  if (sent) {
    return (
      <main style={{ background: '#fff', borderRadius: 20, padding: 20, display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: 22 }}>검수 신청을 보냈습니다</h1>
        <p style={{ fontSize: 14, color: '#666' }}>니니랜드가 확인하고 거래 조건을 정해 승인하면 판매가 시작됩니다. 결과는 내 상품 화면에서 볼 수 있어요.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/vendor" style={{ border: 0, borderRadius: 10, padding: '10px 14px', background: '#111', color: '#fff', fontWeight: 800 }}>내 상품으로</Link>
          <button type="button" onClick={() => { setSent(false); setValue({ ...emptyEditorValue, fulfillment: 'vendor' }); setEditorKey(`new-${Date.now()}`); }}
            style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', background: '#fff', fontWeight: 700 }}>하나 더 올리기</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12, marginBottom: 64 }}>
      <h1 style={{ fontSize: 22 }}>{productId ? '상품 수정 신청' : '상품 올리기'}</h1>
      <p style={{ fontSize: 13, color: '#666' }}>
        올린 내용은 니니랜드 검수 후 판매됩니다. 아동복은 KC 인증번호가 꼭 있어야 해요.
      </p>
      {value ? (
        <ProductEditor
          key={editorKey}
          mode="vendor"
          value={value}
          onChange={setValue}
          onSubmit={() => void submit()}
          submitLabel={productId ? '수정 검수 신청' : '검수 신청'}
          busy={busy}
          uploadFolder={`vendors/${account.vendor.id}`}
          hasVendor
          message={message}
        />
      ) : (
        <p style={{ color: '#888' }}>상품 정보를 불러오는 중…</p>
      )}
    </main>
  );
}
