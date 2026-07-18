'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { type Product } from '../../lib/mockProducts';

const emptyForm = {
  name: '',
  category: '신상품',
  description: '',
  consumerPrice: 60000,
  discountPrice: 55000,
  wholesalePrice: 48000,
  recommendedRetailPrice: 65000,
  minOrderQty: 10,
  orderUnit: 10,
  badge: '신규',
  image: '/placeholder-product.svg',
};

export default function AdminProductsPage() {
  const { products, isAdmin, createProduct, updateProduct, deleteProduct } = useMockStore();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (editingId) {
      const target = products.find((p) => p.id === editingId);
      if (target) {
        updateProduct({ ...target, ...form } as Product);
      }
      setEditingId(null);
    } else {
      createProduct({
        ...form,
        status: '판매중',
        isNew: true,
        isPopular: false,
        isVisible: true,
      } as unknown as Omit<Product, 'id' | 'slug'>);
    }
    setForm(emptyForm);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      consumerPrice: product.consumerPrice,
      discountPrice: product.discountPrice,
      wholesalePrice: product.wholesalePrice,
      recommendedRetailPrice: product.recommendedRetailPrice,
      minOrderQty: product.minOrderQty,
      orderUnit: product.orderUnit,
      badge: product.badge,
      image: product.image,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`'${name}' 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteProduct(id);
      if (editingId === id) cancelEdit();
    }
  };

  const visibleProducts = useMemo(() => products, [products]);

  if (!isAdmin) {
    return <main style={{ padding: 24 }}>관리자만 접근할 수 있는 화면입니다.</main>;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{editingId ? '상품 수정' : '상품 등록'}</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>목업 상품을 등록/수정하고, 가격과 재고 조건을 바로 확인할 수 있습니다.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="상품명" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="카테고리" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="설명" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 80 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={form.image} alt="상품 이미지 미리보기" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '1px solid #eee', background: '#f7f7f7' }} />
            <label style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
              사진 선택
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" value={form.consumerPrice} onChange={(event) => setForm({ ...form, consumerPrice: Number(event.target.value) })} placeholder="소비자가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
            <input type="number" value={form.wholesalePrice} onChange={(event) => setForm({ ...form, wholesalePrice: Number(event.target.value) })} placeholder="도매가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: 'white', fontWeight: 700 }}>
              {editingId ? '수정 완료' : '등록하기'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '12px 14px', background: '#fff' }}>
                취소
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>상품 목록 ({visibleProducts.length}개)</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {visibleProducts.map((product) => (
            <div key={product.id} style={{ border: editingId === product.id ? '2px solid #111' : '1px solid #eee', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={product.image} alt={product.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#f7f7f7', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{product.name}</div>
                  <div style={{ color: '#666', marginTop: 4, fontSize: 14 }}>소비자가 {product.consumerPrice.toLocaleString()}원 · 도매가 {product.wholesalePrice.toLocaleString()}원</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => startEdit(product)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', background: '#fff', fontSize: 13 }}>수정</button>
                <button type="button" onClick={() => handleDelete(product.id, product.name)} style={{ border: 0, borderRadius: 8, padding: '8px 12px', background: '#e5484d', color: 'white', fontSize: 13 }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
