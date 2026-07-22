'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { type ColorOption, type Product } from '../../lib/mockProducts';

const PALETTE = ['#f6a8c4', '#a9c9f6', '#ffd76b', '#b6e6d8', '#c7c7c7', '#e8ddc7', '#2b3a55', '#d84a4a'];

const emptyForm = {
  name: '',
  category: '신상품',
  description: '',
  material: '',
  madeIn: '대한민국',
  washGuide: '',
  consumerPrice: 60000,
  discountPrice: 55000,
  wholesalePrice: 48000,
  recommendedRetailPrice: 65000,
  minOrderQty: 10,
  orderUnit: 10,
  mixOrderAllowed: true,
  vatIncluded: true,
  badge: '신규',
  image: '/placeholder-product.svg',
  colorsInput: '핑크, 블루',
  sizesInput: '90, 100, 110, 120',
  defaultStock: 10,
};

function buildOptions(colorsInput: string, sizesInput: string, defaultStock: number, image: string): ColorOption[] {
  const colors = colorsInput.split(',').map((c) => c.trim()).filter(Boolean);
  const sizes = sizesInput.split(',').map((s) => s.trim()).filter(Boolean);
  return colors.map((color, i) => ({
    color,
    colorHex: PALETTE[i % PALETTE.length],
    image,
    sizes: sizes.map((size) => ({ size, stock: defaultStock })),
  }));
}

export default function AdminProductsPage() {
  const { products, isAdmin, createProduct, updateProduct, deleteProduct } = useMockStore();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleExtraImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setExtraImages((current) => [...current, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeExtraImage = (index: number) => {
    setExtraImages((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { colorsInput, sizesInput, defaultStock, ...rest } = form;
    const options = buildOptions(colorsInput, sizesInput, defaultStock, form.image);
    const images = [form.image, ...extraImages];
    const payload = { ...rest, images, options };

    if (editingId) {
      const target = products.find((p) => p.id === editingId);
      if (target) {
        updateProduct({ ...target, ...payload } as Product);
      }
      setEditingId(null);
    } else {
      createProduct({
        ...payload,
        status: '판매중',
        isNew: true,
        isPopular: false,
        isVisible: true,
      } as unknown as Omit<Product, 'id' | 'slug'>);
    }
    setForm(emptyForm);
    setExtraImages([]);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setExtraImages((product.images ?? []).filter((img) => img !== product.image));
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      material: product.material ?? '',
      madeIn: product.madeIn ?? '대한민국',
      washGuide: product.washGuide ?? '',
      consumerPrice: product.consumerPrice,
      discountPrice: product.discountPrice,
      wholesalePrice: product.wholesalePrice,
      recommendedRetailPrice: product.recommendedRetailPrice,
      minOrderQty: product.minOrderQty,
      orderUnit: product.orderUnit,
      mixOrderAllowed: product.mixOrderAllowed ?? true,
      vatIncluded: product.vatIncluded ?? true,
      badge: product.badge,
      image: product.image,
      colorsInput: (product.options ?? []).map((o) => o.color).join(', ') || '핑크, 블루',
      sizesInput: (product.options?.[0]?.sizes ?? []).map((s) => s.size).join(', ') || '90, 100, 110, 120',
      defaultStock: product.options?.[0]?.sizes?.[0]?.stock ?? 10,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setExtraImages([]);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`'${name}' 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteProduct(id);
      if (editingId === id) cancelEdit();
    }
  };

  const visibleProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [products, query]
  );

  if (!isAdmin) {
    return <main style={{ padding: 24 }}>관리자만 접근할 수 있는 화면입니다.</main>;
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{editingId ? '상품 수정' : '상품 등록'}</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>목업 상품을 등록/수정하고, 컬러·사이즈·재고 조건을 바로 확인할 수 있습니다.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="상품명" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="카테고리 (신상품/베스트/공구상품 등)" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="설명" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 70 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={form.image} alt="상품 이미지 미리보기" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '1px solid #eee', background: '#f7f7f7' }} />
            <label style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
              대표사진 선택
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>추가 이미지 (상세 갤러리용, 여러 장 선택 가능)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {extraImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={img} alt={`추가 이미지 ${idx + 1}`} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                  <button
                    type="button"
                    onClick={() => removeExtraImage(idx)}
                    aria-label="이미지 삭제"
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 0, background: '#e5484d', color: '#fff', fontSize: 12, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <label style={{ width: 56, height: 56, borderRadius: 10, border: '1px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#999', cursor: 'pointer' }}>
                +
                <input type="file" accept="image/*" multiple onChange={handleExtraImagesChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} placeholder="소재 (예: 면 95%, 스판덱스 5%)" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
            <input value={form.madeIn} onChange={(event) => setForm({ ...form, madeIn: event.target.value })} placeholder="제조국" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          </div>
          <input value={form.washGuide} onChange={(event) => setForm({ ...form, washGuide: event.target.value })} placeholder="세탁방법" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" value={form.consumerPrice} onChange={(event) => setForm({ ...form, consumerPrice: Number(event.target.value) })} placeholder="소비자가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
            <input type="number" value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: Number(event.target.value) })} placeholder="할인가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" value={form.wholesalePrice} onChange={(event) => setForm({ ...form, wholesalePrice: Number(event.target.value) })} placeholder="도매가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
            <input type="number" value={form.recommendedRetailPrice} onChange={(event) => setForm({ ...form, recommendedRetailPrice: Number(event.target.value) })} placeholder="권장 소비자가" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="number" value={form.minOrderQty} onChange={(event) => setForm({ ...form, minOrderQty: Number(event.target.value) })} placeholder="도매 최소주문수량" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
            <input type="number" value={form.orderUnit} onChange={(event) => setForm({ ...form, orderUnit: Number(event.target.value) })} placeholder="주문 단위" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px' }} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form.mixOrderAllowed} onChange={(e) => setForm({ ...form, mixOrderAllowed: e.target.checked })} />
              혼합주문 가능
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form.vatIncluded} onChange={(e) => setForm({ ...form, vatIncluded: e.target.checked })} />
              부가세 포함
            </label>
          </div>

          <div style={{ border: '1px dashed #ddd', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>컬러 · 사이즈 · 재고</div>
            <input value={form.colorsInput} onChange={(event) => setForm({ ...form, colorsInput: event.target.value })} placeholder="컬러 (쉼표로 구분, 예: 핑크, 블루)" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 13 }} />
            <input value={form.sizesInput} onChange={(event) => setForm({ ...form, sizesInput: event.target.value })} placeholder="사이즈 (쉼표로 구분, 예: 90, 100, 110, 120)" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 13 }} />
            <input type="number" value={form.defaultStock} onChange={(event) => setForm({ ...form, defaultStock: Number(event.target.value) })} placeholder="각 옵션 기본 재고 수량" style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', fontSize: 13 }} />
            <p style={{ fontSize: 12, color: '#999' }}>등록 후 옵션별 재고를 다르게 조정하려면 아래 목록에서 다시 수정해주세요.</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 20 }}>상품 목록 ({visibleProducts.length}개)</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="상품명으로 검색"
            style={{ border: '1px solid #ddd', borderRadius: 10, padding: '8px 12px', fontSize: 13, minWidth: 160 }}
          />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {visibleProducts.map((product) => (
            <div key={product.id} style={{ border: editingId === product.id ? '2px solid #111' : '1px solid #eee', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={product.image} alt={product.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#f7f7f7', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{product.name}</div>
                  <div style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
                    소비자가 {product.consumerPrice.toLocaleString()}원 · 도매가 {product.wholesalePrice.toLocaleString()}원
                    {!product.wholesalePriceConfirmed && (
                      <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: '#a26500', background: '#fff2d6', padding: '2px 6px', borderRadius: 999 }}>
                        임시
                      </span>
                    )}
                  </div>
                  {product.options && product.options.length > 0 && (
                    <div style={{ color: '#999', marginTop: 2, fontSize: 12 }}>
                      컬러 {product.options.length}종 · 사이즈 {product.options[0].sizes.map((s) => s.size).join('/')}
                    </div>
                  )}
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
