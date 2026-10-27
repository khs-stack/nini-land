'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { CONSUMER_MODE_LABEL, isGroupbuyClosed, salePrice, type Product } from '../../lib/mockProducts';
import { emptyEditorValue, ProductEditor, productToEditor, type EditorValue } from '../../components/ProductEditor';
import { loadPrivateTerms, saveAdminProduct } from '../../lib/productAdmin';
import { supabase } from '../../lib/supabase';

type Filter = 'all' | 'own' | 'vendor' | 'hidden';

let editorSeq = 0;
const nextEditorKey = (prefix: string) => `${prefix}-${++editorSeq}`;

export default function AdminProductsPage() {
  const { products, isAdmin, deleteProduct, updateProduct, groupbuyCounts, refreshCatalog } = useMockStore();
  const [editing, setEditing] = useState<{ product: Product | null; value: EditorValue; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin || !supabase) return;
    void supabase.from('vendors').select('id, company_name').then(({ data }) => {
      setVendorNames(Object.fromEntries((data ?? []).map((v) => [v.id as string, v.company_name as string])));
    });
  }, [isAdmin]);

  const startNew = () => {
    setMessage(null);
    setEditing({ product: null, value: emptyEditorValue, key: nextEditorKey('new') });
  };

  const startEdit = async (product: Product, asCopy = false) => {
    setMessage(null);
    const terms = await loadPrivateTerms(product.id);
    const value = productToEditor(product, terms);
    setEditing({
      product: asCopy ? null : product,
      value: asCopy ? { ...value, name: `${value.name} (복사)`, groupbuyEndsAt: '', active: false } : value,
      key: nextEditorKey(`${asCopy ? 'copy' : 'edit'}-${product.id}`),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const result = await saveAdminProduct(
      editing.value,
      editing.product ? { id: editing.product.id, slug: editing.product.slug, vendorId: editing.product.vendorId, sort: editing.product.sort } : null,
      products.length + 1
    );
    setBusy(false);
    if (result.error) {
      setMessage({ tone: 'error', text: result.error });
      return;
    }
    await refreshCatalog();
    setMessage({ tone: 'ok', text: editing.product ? '저장했습니다.' : '등록했습니다.' });
    setEditing(null);
  };

  const toggleActive = async (product: Product) => {
    const result = await updateProduct({ ...product, active: product.active === false });
    if (result.error) setMessage({ tone: 'error', text: result.error });
  };

  const handleDelete = async (product: Product) => {
    if (confirmDelete !== product.id) {
      setConfirmDelete(product.id);
      return;
    }
    setConfirmDelete(null);
    const result = await deleteProduct(product.id);
    if (result.error) setMessage({ tone: 'error', text: result.error });
  };

  const visible = useMemo(() => products.filter((p) => {
    if (filter === 'own' && p.vendorId) return false;
    if (filter === 'vendor' && !p.vendorId) return false;
    if (filter === 'hidden' && p.active !== false) return false;
    return p.name.toLowerCase().includes(query.trim().toLowerCase());
  }), [products, filter, query]);

  if (!isAdmin) return null;

  return (
    <main style={{ display: 'grid', gap: 16, paddingBottom: 64 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <h1 style={{ fontSize: 22 }}>{editing ? (editing.product ? '상품 수정' : '새 상품 등록') : '상품 관리'}</h1>
          {!editing && (
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href="/admin/review" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700 }}>도매처 신청 검수</Link>
              <button type="button" onClick={startNew} style={{ border: 0, borderRadius: 10, padding: '9px 14px', background: '#111', color: '#fff', fontWeight: 800, fontSize: 13 }}>+ 니니랜드 상품 등록</button>
            </div>
          )}
        </div>
        {editing ? (
          <>
            {editing.product?.vendorId && (
              <p style={{ fontSize: 13, color: '#7048e8', fontWeight: 700 }}>입점 도매처 상품 · {vendorNames[editing.product.vendorId] ?? '도매처'}</p>
            )}
            <ProductEditor
              key={editing.key}
              mode="admin"
              value={editing.value}
              onChange={(value) => setEditing((current) => (current ? { ...current, value } : current))}
              onSubmit={() => void save()}
              submitLabel={editing.product ? '수정 저장' : '상품 등록'}
              busy={busy}
              uploadFolder="admin"
              hasVendor={Boolean(editing.product?.vendorId)}
              message={message}
              onCancel={() => setEditing(null)}
            />
          </>
        ) : (
          message && <p style={{ fontSize: 13, fontWeight: 700, color: message.tone === 'ok' ? '#2f6f4f' : '#c93442' }}>{message.text}</p>
        )}
      </section>

      {!editing && (
        <section style={{ background: '#fff', borderRadius: 20, padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([['all', '전체'], ['own', '니니랜드 상품'], ['vendor', '도매처 상품'], ['hidden', '판매 전·숨김']] as Array<[Filter, string]>).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
                style={{ border: filter === key ? 0 : '1px solid #ddd', borderRadius: 999, padding: '7px 12px', fontSize: 13, fontWeight: 700, background: filter === key ? '#111' : '#fff', color: filter === key ? '#fff' : '#111' }}>
                {label}
              </button>
            ))}
            <label htmlFor="p-search" className="visually-hidden">상품명 검색</label>
            <input id="p-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="상품명 검색"
              style={{ border: '1px solid #ddd', borderRadius: 10, padding: '7px 12px', fontSize: 13, marginLeft: 'auto', minWidth: 0 }} />
          </div>
          {visible.map((product) => {
            const hidden = product.active === false;
            const closed = isGroupbuyClosed(product);
            return (
              <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: hidden ? 0.65 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', background: '#f7f7f7', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {product.name}
                      {product.vendorId && <Tag color="#7048e8">{vendorNames[product.vendorId] ?? '도매처'}</Tag>}
                      {hidden && <Tag color="#888">판매 전</Tag>}
                      {closed && <Tag color="#c93442">마감</Tag>}
                      {product.wholesaleEnabled && <Tag color="#0b7285">도매</Tag>}
                      {!product.kcCert && <Tag color="#b26b00">KC 미입력</Tag>}
                    </div>
                    <div style={{ color: '#666', marginTop: 4, fontSize: 13 }}>
                      {CONSUMER_MODE_LABEL[product.consumerMode ?? 'retail']}
                      {product.consumerMode !== 'none' && ` ${salePrice(product).toLocaleString()}원`}
                      {' · '}주문 {groupbuyCounts[product.id] ?? 0}개
                      {product.groupbuyEndsAt && product.consumerMode === 'groupbuy' && ` · 마감 ${new Date(product.groupbuyEndsAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <SmallBtn onClick={() => void startEdit(product)}>수정</SmallBtn>
                  {!product.vendorId && <SmallBtn onClick={() => void startEdit(product, true)}>복사</SmallBtn>}
                  <SmallBtn onClick={() => void toggleActive(product)}>{hidden ? '판매 개시' : '숨기기'}</SmallBtn>
                  <SmallBtn danger onClick={() => void handleDelete(product)}>{confirmDelete === product.id ? '정말 삭제' : '삭제'}</SmallBtn>
                </div>
              </div>
            );
          })}
          {visible.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>해당하는 상품이 없습니다.</p>}
        </section>
      )}
    </main>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 6, padding: '1px 6px' }}>{children}</span>;
}

function SmallBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{ border: danger ? 0 : '1px solid #ddd', borderRadius: 8, padding: '8px 11px', background: danger ? '#e5484d' : '#fff', color: danger ? '#fff' : '#111', fontSize: 13 }}>
      {children}
    </button>
  );
}
