'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { type Product } from '../../lib/mockProducts';

export default function AdminProductsPage() {
  const { products, isAdmin, createProduct, updateProduct } = useMockStore();
  const [form, setForm] = useState({
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
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createProduct({
      ...form,
      image: '/placeholder-product.svg',
      status: '판매중',
      isNew: true,
      isPopular: false,
      isVisible: true,
    } as unknown as Omit<Product, 'id' | 'slug'>);
    setForm({ ...form, name: '', description: '', category: '신상품', badge: '신규' });
  };

  const visibleProducts = useMemo(() => products.slice(0, 6), [products]);

  if (!isAdmin) {
    return <main style={{ padding: 24 }}>관리자만 접근할 수 있는 화면입니다.</main>;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>상품 등록</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>목업 상품을 등록하고, 가격과 재고 조건을 바로 확인할 수 있습니다.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="상품명" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="카테고리" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="설명" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 80 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" value={form.consumerPrice} onChange={(event) => setForm({ ...form, consumerPrice: Number(event.target.value) })} placeholder="소비자가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
            <input type="number" value={form.wholesalePrice} onChange={(event) => setForm({ ...form, wholesalePrice: Number(event.target.value) })} placeholder="도매가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          </div>
          <button type="submit" style={{ border: 0, borderRadius: 12, padding: '12px 14px', background: '#111', color: 'white' }}>등록하기</button>
        </form>
      </section>

      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>상품 목록</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {visibleProducts.map((product) => (
            <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{product.name}</div>
              <div style={{ color: '#666', marginTop: 4 }}>소비자가 {product.consumerPrice.toLocaleString()}원 · 도매가 {product.wholesalePrice.toLocaleString()}원</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
