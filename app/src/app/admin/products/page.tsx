'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import { isGroupbuyClosed, salePrice, type ColorOption, type Product } from '../../lib/mockProducts';
import { WHOLESALE_ENABLED } from '../../lib/mockSettings';
import { PRODUCT_IMAGE_BUCKET, supabase } from '../../lib/supabase';

const PALETTE = ['#f6a8c4', '#a9c9f6', '#ffd76b', '#b6e6d8', '#c7c7c7', '#e8ddc7', '#2b3a55', '#d84a4a'];
const CATEGORIES = ['공구상품', '신상품', '베스트'];

const field = { border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15, width: '100%', minWidth: 0 } as const;
const label = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444', minWidth: 0 } as const;
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 } as const;

interface FormState {
  name: string;
  category: string;
  badge: string;
  description: string;
  consumerPrice: number;
  discountPrice: number;
  wholesalePrice: number;
  groupbuyEndsAt: string; // datetime-local 값
  groupbuyTarget: number;
  active: boolean;
  kcCert: string;
  material: string;
  madeIn: string;
  manufacturer: string;
  sizeGuide: string;
  washGuide: string;
  precautions: string;
  shippingNote: string;
  image: string;
  images: string[];
  options: ColorOption[];
}

const emptyForm: FormState = {
  name: '',
  category: '공구상품',
  badge: '공구',
  description: '',
  consumerPrice: 0,
  discountPrice: 0,
  wholesalePrice: 0,
  groupbuyEndsAt: '',
  groupbuyTarget: 0,
  active: true,
  kcCert: '',
  material: '',
  madeIn: '',
  manufacturer: '',
  sizeGuide: '',
  washGuide: '',
  precautions: '',
  shippingNote: '공구 마감 후 도매처에 일괄 주문하며, 입고되는 대로 순차 발송합니다.',
  image: '',
  images: [],
  options: [],
};

/** ISO → datetime-local(한국시간 기준 브라우저 로컬) */
function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function buildOptions(colors: string[], sizes: string[], previous: ColorOption[], defaultStock: number): ColorOption[] {
  return colors.map((color, index) => {
    const prev = previous.find((option) => option.color === color);
    return {
      color,
      colorHex: prev?.colorHex ?? PALETTE[index % PALETTE.length],
      image: prev?.image,
      sizes: sizes.map((size) => ({ size, stock: prev?.sizes.find((s) => s.size === size)?.stock ?? defaultStock })),
    };
  });
}

async function uploadImage(file: File): Promise<string> {
  if (!supabase) {
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function AdminProductsPage() {
  const { products, isAdmin, createProduct, updateProduct, deleteProduct, groupbuyCounts } = useMockStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colorsInput, setColorsInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');
  const [defaultStock, setDefaultStock] = useState(999);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const applyOptionInputs = (colors = colorsInput, sizes = sizesInput) => {
    const colorList = colors.split(',').map((c) => c.trim()).filter(Boolean);
    const sizeList = sizes.split(',').map((s) => s.trim()).filter(Boolean);
    setForm((current) => ({ ...current, options: buildOptions(colorList, sizeList, current.options, defaultStock) }));
  };

  const setStock = (color: string, size: string, stock: number) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.color !== color ? option : { ...option, sizes: option.sizes.map((s) => (s.size === size ? { ...s, stock } : s)) }
      ),
    }));
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, target: 'main' | 'extra' | { color: string }) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setMessage(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: 8MB 이하 사진만 올릴 수 있습니다.`);
        urls.push(await uploadImage(file));
      }
      if (target === 'main') set('image', urls[0]);
      else if (target === 'extra') setForm((current) => ({ ...current, images: [...current.images, ...urls] }));
      else setForm((current) => ({ ...current, options: current.options.map((o) => (o.color === target.color ? { ...o, image: urls[0] } : o)) }));
    } catch (error) {
      setMessage({ tone: 'error', text: `사진을 올리지 못했습니다. ${(error as Error).message}` });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setColorsInput('');
    setSizesInput('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!form.name.trim()) return setMessage({ tone: 'error', text: '상품명을 입력해주세요.' });
    if (!form.consumerPrice || form.consumerPrice <= 0) return setMessage({ tone: 'error', text: '판매가를 입력해주세요.' });
    if (form.discountPrice && form.discountPrice > form.consumerPrice) return setMessage({ tone: 'error', text: '공구가는 정가보다 클 수 없습니다.' });
    if (!form.image) return setMessage({ tone: 'error', text: '대표 사진을 올려주세요.' });

    const base = products.find((p) => p.id === editingId);
    const payload: Product = {
      ...(base ?? ({} as Product)),
      id: base?.id ?? '',
      slug: base?.slug ?? '',
      name: form.name.trim(),
      category: form.category,
      badge: form.badge.trim(),
      description: form.description.trim(),
      image: form.image,
      images: [form.image, ...form.images.filter((img) => img !== form.image)],
      consumerPrice: Math.round(form.consumerPrice),
      discountPrice: Math.round(form.discountPrice || 0),
      wholesalePrice: Math.round(form.wholesalePrice || base?.wholesalePrice || 0),
      recommendedRetailPrice: base?.recommendedRetailPrice ?? Math.round(form.consumerPrice),
      minOrderQty: base?.minOrderQty ?? 1,
      orderUnit: base?.orderUnit ?? 1,
      mixOrderAllowed: base?.mixOrderAllowed ?? true,
      vatIncluded: base?.vatIncluded ?? true,
      kcCert: form.kcCert.trim(),
      material: form.material.trim(),
      madeIn: form.madeIn.trim(),
      manufacturer: form.manufacturer.trim(),
      sizeGuide: form.sizeGuide.trim(),
      washGuide: form.washGuide.trim(),
      precautions: form.precautions.trim(),
      shippingNote: form.shippingNote.trim(),
      options: form.options,
      groupbuyTarget: Math.max(0, Math.round(form.groupbuyTarget || 0)),
      groupbuyEndsAt: fromLocalInput(form.groupbuyEndsAt),
      active: form.active,
    };

    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, slug, ...createPayload } = payload;
    const result = editingId ? await updateProduct(payload) : await createProduct(createPayload);
    setBusy(false);
    if (result.error) {
      setMessage({ tone: 'error', text: result.error });
      return;
    }
    setMessage({ tone: 'ok', text: editingId ? '저장했습니다.' : '등록했습니다. 손님 화면에 바로 보입니다.' });
    resetForm();
  };

  const loadIntoForm = (product: Product, asCopy = false) => {
    setEditingId(asCopy ? null : product.id);
    setForm({
      name: asCopy ? `${product.name} (복사)` : product.name,
      category: product.category,
      badge: product.badge ?? '',
      description: product.description ?? '',
      consumerPrice: product.consumerPrice,
      discountPrice: product.discountPrice,
      wholesalePrice: product.wholesalePrice,
      groupbuyEndsAt: asCopy ? '' : toLocalInput(product.groupbuyEndsAt),
      groupbuyTarget: product.groupbuyTarget ?? 0,
      active: asCopy ? true : product.active !== false,
      kcCert: product.kcCert ?? '',
      material: product.material ?? '',
      madeIn: product.madeIn ?? '',
      manufacturer: product.manufacturer ?? '',
      sizeGuide: product.sizeGuide ?? '',
      washGuide: product.washGuide ?? '',
      precautions: product.precautions ?? '',
      shippingNote: product.shippingNote ?? '',
      image: product.image,
      images: (product.images ?? []).filter((img) => img !== product.image),
      options: product.options ?? [],
    });
    setColorsInput((product.options ?? []).map((o) => o.color).join(', '));
    setSizesInput((product.options?.[0]?.sizes ?? []).map((s) => s.size).join(', '));
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    else if (editingId === product.id) resetForm();
  };

  const visibleProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [products, query]
  );

  if (!isAdmin) {
    return <main style={{ padding: 24 }}>관리자만 접근할 수 있는 화면입니다.</main>;
  }

  const sizes = form.options[0]?.sizes.map((s) => s.size) ?? [];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '8px 0 64px', display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>{editingId ? '상품 수정' : '새 공구 상품 등록'}</h1>
        <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
          저장하면 손님 화면에 바로 반영됩니다. 재고를 0으로 두면 그 옵션은 품절로 표시되고 주문이 막힙니다.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={label}>상품명
            <input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 꽃무늬 누빔 상하세트" style={field} />
          </label>

          <div style={twoCol}>
            <label style={label}>정가 (원)
              <input id="p-consumer" type="number" inputMode="numeric" min={0} value={form.consumerPrice || ''} onChange={(e) => set('consumerPrice', Number(e.target.value))} style={field} />
            </label>
            <label style={label}>공구가 (원, 비우면 정가로 판매)
              <input id="p-discount" type="number" inputMode="numeric" min={0} value={form.discountPrice || ''} onChange={(e) => set('discountPrice', Number(e.target.value))} style={field} />
            </label>
            <label style={label}>도매 원가 (관리자만 보임)
              <input id="p-wholesale" type="number" inputMode="numeric" min={0} value={form.wholesalePrice || ''} onChange={(e) => set('wholesalePrice', Number(e.target.value))} style={field} />
            </label>
          </div>
          {form.consumerPrice > 0 && form.wholesalePrice > 0 && (
            <p style={{ fontSize: 13, color: '#2f6f4f', marginTop: -6 }}>
              1개 팔 때 마진 {(salePrice(form) - form.wholesalePrice).toLocaleString()}원 ({Math.round(((salePrice(form) - form.wholesalePrice) / salePrice(form)) * 100)}%)
            </p>
          )}

          <div style={twoCol}>
            <label style={label}>공구 마감 일시
              <input id="p-ends" type="datetime-local" value={form.groupbuyEndsAt} onChange={(e) => set('groupbuyEndsAt', e.target.value)} style={field} />
            </label>
            <label style={label}>목표 수량 (선택, 진행률 표시용)
              <input id="p-target" type="number" inputMode="numeric" min={0} value={form.groupbuyTarget || ''} onChange={(e) => set('groupbuyTarget', Number(e.target.value))} style={field} />
            </label>
            <label style={label}>분류
              <select id="p-category" value={form.category} onChange={(e) => set('category', e.target.value)} style={field}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={label}>배지 문구
              <input id="p-badge" value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="예: 4 COLOR" style={field} />
            </label>
          </div>

          <label style={label}>상품 설명
            <textarea id="p-desc" value={form.description} onChange={(e) => set('description', e.target.value)} style={{ ...field, minHeight: 90 }} />
          </label>

          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>사진 {uploading && <span style={{ color: '#888', fontWeight: 400 }}>· 올리는 중…</span>}</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="대표 사진" style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover', border: '2px solid #111' }} />
              ) : (
                <div style={{ width: 84, height: 84, borderRadius: 12, background: '#f4f1ee', display: 'grid', placeItems: 'center', fontSize: 12, color: '#999' }}>대표 사진</div>
              )}
              <label style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
                대표 사진 올리기
                <input type="file" accept="image/*" onChange={(e) => void handleUpload(e, 'main')} style={{ display: 'none' }} />
              </label>
              {form.images.map((img, idx) => (
                <div key={img} style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`추가 사진 ${idx + 1}`} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid #eee' }} />
                  <button type="button" onClick={() => set('images', form.images.filter((x) => x !== img))} aria-label="사진 빼기"
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 0, background: '#e5484d', color: '#fff', fontSize: 13, cursor: 'pointer' }}>×</button>
                </div>
              ))}
              <label style={{ width: 60, height: 60, borderRadius: 10, border: '1px dashed #bbb', display: 'grid', placeItems: 'center', fontSize: 22, color: '#999', cursor: 'pointer' }} aria-label="상세 사진 추가">
                +
                <input type="file" accept="image/*" multiple onChange={(e) => void handleUpload(e, 'extra')} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ border: '1px dashed #ccc', borderRadius: 14, padding: 14, display: 'grid', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>옵션 · 재고</span>
            <div style={twoCol}>
              <label style={label}>컬러 (쉼표로 구분)
                <input id="p-colors" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} onBlur={() => applyOptionInputs()} placeholder="예: 핑크, 블루" style={field} />
              </label>
              <label style={label}>사이즈 (쉼표로 구분)
                <input id="p-sizes" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} onBlur={() => applyOptionInputs()} placeholder="예: 5호, 7호, 9호, 11호" style={field} />
              </label>
              <label style={label}>새 옵션 기본 재고
                <input id="p-defstock" type="number" min={0} value={defaultStock} onChange={(e) => setDefaultStock(Number(e.target.value))} style={field} />
              </label>
            </div>
            <p style={{ fontSize: 12, color: '#888' }}>공구는 주문받고 발주하므로 기본 재고를 넉넉히(999) 두고, 도매처에서 품절된 옵션만 0으로 바꾸면 됩니다.</p>
            {form.options.length > 0 && sizes.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 6 }}>컬러</th>
                      {sizes.map((size) => <th key={size} style={{ padding: 6 }}>{size}</th>)}
                      <th style={{ padding: 6 }}>컬러 사진</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.options.map((option) => (
                      <tr key={option.color} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
                          <input type="color" value={option.colorHex} aria-label={`${option.color} 색상`} onChange={(e) => setForm((c) => ({ ...c, options: c.options.map((o) => (o.color === option.color ? { ...o, colorHex: e.target.value } : o)) }))}
                            style={{ width: 22, height: 22, border: 0, padding: 0, verticalAlign: 'middle', marginRight: 6 }} />
                          {option.color}
                        </td>
                        {option.sizes.map((s) => (
                          <td key={s.size} style={{ padding: 4 }}>
                            <input type="number" min={0} value={s.stock} aria-label={`${option.color} ${s.size} 재고`} onChange={(e) => setStock(option.color, s.size, Math.max(0, Number(e.target.value)))}
                              style={{ width: 62, border: '1px solid #ddd', borderRadius: 8, padding: '6px', fontSize: 13, background: s.stock <= 0 ? '#fff0f0' : '#fff' }} />
                          </td>
                        ))}
                        <td style={{ padding: 4 }}>
                          <label style={{ fontSize: 12, color: '#2f6fed', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {option.image ? '바꾸기' : '올리기'}
                            <input type="file" accept="image/*" onChange={(e) => void handleUpload(e, { color: option.color })} style={{ display: 'none' }} />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <details style={{ border: '1px solid #eee', borderRadius: 14, padding: 14 }} open={!form.kcCert}>
            <summary style={{ fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>상품정보 고시 · KC 인증 (아동복 필수)</summary>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <label style={label}>KC 인증번호 (도매처에 확인)
                <input id="p-kc" value={form.kcCert} onChange={(e) => set('kcCert', e.target.value)} placeholder="예: CB063R1234-5001" style={field} />
              </label>
              <div style={twoCol}>
                <label style={label}>소재
                  <input id="p-material" value={form.material} onChange={(e) => set('material', e.target.value)} style={field} />
                </label>
                <label style={label}>제조국
                  <input id="p-madein" value={form.madeIn} onChange={(e) => set('madeIn', e.target.value)} style={field} />
                </label>
                <label style={label}>제조사(자)
                  <input id="p-maker" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} style={field} />
                </label>
                <label style={label}>사이즈 안내
                  <input id="p-sizeguide" value={form.sizeGuide} onChange={(e) => set('sizeGuide', e.target.value)} placeholder="예: 5호(100) · 7호(110)" style={field} />
                </label>
              </div>
              <label style={label}>세탁 방법
                <input id="p-wash" value={form.washGuide} onChange={(e) => set('washGuide', e.target.value)} style={field} />
              </label>
              <label style={label}>취급 주의사항
                <input id="p-caution" value={form.precautions} onChange={(e) => set('precautions', e.target.value)} style={field} />
              </label>
              <label style={label}>출고 안내
                <input id="p-shipnote" value={form.shippingNote} onChange={(e) => set('shippingNote', e.target.value)} style={field} />
              </label>
            </div>
          </details>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <input id="p-active" type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            손님 화면에 보이기
          </label>

          {message && (
            <p style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: message.tone === 'ok' ? '#eef8f2' : '#fff0f0', color: message.tone === 'ok' ? '#2f6f4f' : '#c93442' }}>
              {message.text}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy || uploading} style={{ flex: 1, border: 0, borderRadius: 12, padding: '13px 14px', background: '#111', color: 'white', fontWeight: 700, fontSize: 15 }}>
              {busy ? '저장 중…' : editingId ? '수정 저장' : '상품 등록'}
            </button>
            {(editingId || form.name) && (
              <button type="button" onClick={resetForm} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '12px 14px', background: '#fff' }}>
                새로 쓰기
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 20 }}>상품 목록 ({visibleProducts.length}개)</h2>
          <input id="p-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="상품명으로 검색" style={{ ...field, width: 'auto', fontSize: 13, padding: '8px 12px' }} />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {visibleProducts.map((product) => {
            const hidden = product.active === false;
            const closed = isGroupbuyClosed(product);
            return (
              <div key={product.id} style={{ border: editingId === product.id ? '2px solid #111' : '1px solid #eee', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: hidden ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', background: '#f7f7f7', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {product.name}
                      {hidden && <Tag color="#888">숨김</Tag>}
                      {closed && <Tag color="#c93442">마감</Tag>}
                      {!product.kcCert && <Tag color="#b26b00">KC 미입력</Tag>}
                    </div>
                    <div style={{ color: '#666', marginTop: 4, fontSize: 13 }}>
                      공구가 {salePrice(product).toLocaleString()}원
                      {product.wholesalePrice > 0 && ` · 원가 ${product.wholesalePrice.toLocaleString()}원`}
                      {' · '}주문 {groupbuyCounts[product.id] ?? 0}개
                    </div>
                    <div style={{ color: '#999', marginTop: 2, fontSize: 12 }}>
                      {product.groupbuyEndsAt ? `마감 ${new Date(product.groupbuyEndsAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : '마감일 없음'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <SmallBtn onClick={() => loadIntoForm(product)}>수정</SmallBtn>
                  <SmallBtn onClick={() => loadIntoForm(product, true)}>복사</SmallBtn>
                  <SmallBtn onClick={() => void toggleActive(product)}>{hidden ? '보이기' : '숨기기'}</SmallBtn>
                  <SmallBtn danger onClick={() => void handleDelete(product)}>{confirmDelete === product.id ? '정말 삭제' : '삭제'}</SmallBtn>
                </div>
              </div>
            );
          })}
        </div>
        {WHOLESALE_ENABLED && <p style={{ marginTop: 12, fontSize: 12, color: '#888' }}>도매회원 기능이 켜져 있습니다.</p>}
      </section>
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
