'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import {
  AUDIENCE_LABEL,
  CONSUMER_MODE_LABEL,
  DEAL_LABEL,
  FULFILLMENT_LABEL,
  salePrice,
  type ColorOption,
  type ConsumerMode,
  type DealType,
  type Fulfillment,
  type Product,
  type WholesaleAudience,
} from '../lib/mockProducts';
import { PRODUCT_IMAGE_BUCKET, supabase } from '../lib/supabase';

const PALETTE = ['#f6a8c4', '#a9c9f6', '#ffd76b', '#b6e6d8', '#c7c7c7', '#e8ddc7', '#2b3a55', '#d84a4a'];
const CATEGORIES = ['공구상품', '신상품', '베스트'];

const field = { border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', fontSize: 15, width: '100%', minWidth: 0, background: '#fff' } as const;
const label = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700, color: '#444', minWidth: 0 } as const;
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 } as const;
const box = { border: '1px solid #eee', borderRadius: 14, padding: 14, display: 'grid', gap: 12 } as const;

/** 편집기에서 다루는 전체 값: 공개 상품 정보 + 도매 조건 + 매입가 + (관리자) 거래 조건 */
export interface EditorValue {
  name: string;
  category: string;
  badge: string;
  description: string;
  consumerPrice: number;
  discountPrice: number;
  consumerMode: ConsumerMode;
  groupbuyEndsAt: string; // datetime-local
  groupbuyTarget: number;
  wholesaleEnabled: boolean;
  wholesaleAudience: WholesaleAudience;
  wholesalePrice: number;
  wholesaleMinQty: number;
  wholesaleUnit: number;
  supplyPrice: number;
  fulfillment: Fulfillment;
  dealType: DealType;
  commissionRate: number;
  wholesaleCommissionRate: string; // 비우면 일반 판매와 같은 비율
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

export const emptyEditorValue: EditorValue = {
  name: '', category: '공구상품', badge: '', description: '',
  consumerPrice: 0, discountPrice: 0, consumerMode: 'groupbuy', groupbuyEndsAt: '', groupbuyTarget: 0,
  wholesaleEnabled: false, wholesaleAudience: 'business', wholesalePrice: 0, wholesaleMinQty: 1, wholesaleUnit: 1,
  supplyPrice: 0, fulfillment: 'nini', dealType: 'own', commissionRate: 0, wholesaleCommissionRate: '', active: true,
  kcCert: '', material: '', madeIn: '', manufacturer: '', sizeGuide: '', washGuide: '', precautions: '',
  shippingNote: '', image: '', images: [], options: [],
};

export function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

/** 상품 + 비공개 조건 → 편집기 값 */
export function productToEditor(
  product: Product,
  extra: { wholesale?: { price: number; min_qty: number; order_unit: number } | null; costs?: { supply_price: number; deal_type: DealType; commission_rate: number; wholesale_commission_rate: number | null } | null } = {}
): EditorValue {
  return {
    name: product.name,
    category: product.category,
    badge: product.badge ?? '',
    description: product.description ?? '',
    consumerPrice: product.consumerPrice,
    discountPrice: product.discountPrice,
    consumerMode: product.consumerMode ?? 'retail',
    groupbuyEndsAt: toLocalInput(product.groupbuyEndsAt),
    groupbuyTarget: product.groupbuyTarget ?? 0,
    wholesaleEnabled: product.wholesaleEnabled ?? false,
    wholesaleAudience: product.wholesaleAudience ?? 'business',
    wholesalePrice: extra.wholesale?.price ?? 0,
    wholesaleMinQty: extra.wholesale?.min_qty ?? 1,
    wholesaleUnit: extra.wholesale?.order_unit ?? 1,
    supplyPrice: extra.costs?.supply_price ?? 0,
    fulfillment: product.fulfillment ?? 'nini',
    dealType: extra.costs?.deal_type ?? (product.vendorId ? 'commission' : 'own'),
    commissionRate: Number(extra.costs?.commission_rate ?? 0),
    wholesaleCommissionRate: extra.costs?.wholesale_commission_rate == null ? '' : String(extra.costs.wholesale_commission_rate),
    active: product.active !== false,
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
  };
}

/** 편집기 값 → 공개 상품 data (jsonb에 들어가는 부분) */
export function editorToProductData(v: EditorValue) {
  return {
    name: v.name.trim(),
    category: v.category,
    badge: v.badge.trim(),
    description: v.description.trim(),
    image: v.image,
    images: [v.image, ...v.images.filter((img) => img !== v.image)],
    consumerPrice: Math.round(v.consumerPrice),
    discountPrice: Math.round(v.discountPrice || 0),
    kcCert: v.kcCert.trim(),
    material: v.material.trim(),
    madeIn: v.madeIn.trim(),
    manufacturer: v.manufacturer.trim(),
    sizeGuide: v.sizeGuide.trim(),
    washGuide: v.washGuide.trim(),
    precautions: v.precautions.trim(),
    shippingNote: v.shippingNote.trim(),
    options: v.options,
    groupbuyTarget: Math.max(0, Math.round(v.groupbuyTarget || 0)),
  };
}

export function validateEditor(v: EditorValue, mode: 'admin' | 'vendor'): string | null {
  if (!v.name.trim()) return '상품명을 입력해주세요.';
  if (!v.image) return '대표 사진을 올려주세요.';
  if (v.consumerMode !== 'none') {
    if (!v.consumerPrice || v.consumerPrice <= 0) return '판매가(정가)를 입력해주세요.';
    if (v.discountPrice && v.discountPrice > v.consumerPrice) return '할인가·공구가는 정가보다 클 수 없습니다.';
  }
  if (v.consumerMode === 'none' && !v.wholesaleEnabled) return '일반 판매를 안 하면 도매 판매를 켜야 합니다.';
  if (v.wholesaleEnabled && (!v.wholesalePrice || v.wholesalePrice <= 0)) return '도매가를 입력해주세요.';
  if (v.wholesaleEnabled && v.wholesaleMinQty < 1) return '도매 최소 수량은 1개 이상입니다.';
  if (mode === 'admin' && v.dealType === 'commission' && (v.commissionRate < 0 || v.commissionRate > 100)) return '수수료율은 0~100% 사이로 넣어주세요.';
  if (v.dealType === 'purchase' && v.supplyPrice <= 0) return '사입 거래는 매입가(공급가)를 넣어주세요.';
  return null;
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

async function uploadImage(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error('저장소에 연결되지 않았습니다.');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** 거래 방식별로 1개 팔 때 각자 몫 미리보기 */
export function sharePreview(price: number, dealType: DealType, rate: number, supply: number) {
  if (price <= 0) return null;
  if (dealType === 'own') return { vendor: 0, nini: price };
  if (dealType === 'commission') {
    const nini = Math.round((price * rate) / 100);
    return { vendor: price - nini, nini };
  }
  const vendor = Math.min(supply, price);
  return { vendor, nini: price - vendor };
}

export function ProductEditor({
  mode,
  value,
  onChange,
  onSubmit,
  submitLabel,
  busy,
  uploadFolder,
  hasVendor,
  message,
  onCancel,
}: {
  mode: 'admin' | 'vendor';
  value: EditorValue;
  onChange: (next: EditorValue) => void;
  onSubmit: () => void;
  submitLabel: string;
  busy?: boolean;
  /** 사진 저장 폴더 (관리자: admin, 도매처: vendors/<id>) */
  uploadFolder: string;
  /** 입점 도매처 상품인지 (거래 방식 선택지가 달라짐) */
  hasVendor: boolean;
  message?: { tone: 'ok' | 'error'; text: string } | null;
  onCancel?: () => void;
}) {
  const v = value;
  const set = <K extends keyof EditorValue>(key: K, next: EditorValue[K]) => onChange({ ...v, [key]: next });
  const [colorsInput, setColorsInput] = useState(v.options.map((o) => o.color).join(', '));
  const [sizesInput, setSizesInput] = useState((v.options[0]?.sizes ?? []).map((s) => s.size).join(', '));
  const [defaultStock, setDefaultStock] = useState(999);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');

  const applyOptions = () => {
    const colors = colorsInput.split(',').map((c) => c.trim()).filter(Boolean);
    const sizes = sizesInput.split(',').map((s) => s.trim()).filter(Boolean);
    set('options', buildOptions(colors.length ? colors : sizes.length ? ['기본'] : [], sizes.length ? sizes : colors.length ? ['FREE'] : [], v.options, defaultStock));
  };

  const setStock = (color: string, size: string, stock: number) =>
    set('options', v.options.map((o) => (o.color !== color ? o : { ...o, sizes: o.sizes.map((s) => (s.size === size ? { ...s, stock } : s)) })));

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, target: 'main' | 'extra' | { color: string }) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setLocalError('');
    try {
      const urls: string[] = [];
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: 8MB 이하 사진만 올릴 수 있습니다.`);
        urls.push(await uploadImage(file, uploadFolder));
      }
      if (target === 'main') onChange({ ...v, image: urls[0] });
      else if (target === 'extra') onChange({ ...v, images: [...v.images, ...urls] });
      else onChange({ ...v, options: v.options.map((o) => (o.color === target.color ? { ...o, image: urls[0] } : o)) });
    } catch (error) {
      setLocalError(`사진을 올리지 못했습니다. ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateEditor(v, mode);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError('');
    onSubmit();
  };

  const sizes = v.options[0]?.sizes.map((s) => s.size) ?? [];
  const consumerPreview = sharePreview(salePrice(v), hasVendor ? v.dealType : 'own', v.commissionRate, v.supplyPrice);
  const wsRate = v.wholesaleCommissionRate === '' ? v.commissionRate : Number(v.wholesaleCommissionRate);
  const wholesalePreview = v.wholesaleEnabled ? sharePreview(v.wholesalePrice, hasVendor ? v.dealType : 'own', wsRate, v.supplyPrice) : null;
  const shownError = localError || (message?.tone === 'error' ? message.text : '');

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <label style={label}>상품명
        <input id="pe-name" value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 꽃무늬 누빔 상하세트" style={field} />
      </label>
      <div style={grid}>
        <label style={label}>분류
          <select id="pe-category" value={v.category} onChange={(e) => set('category', e.target.value)} style={field}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={label}>배지 문구 (선택)
          <input id="pe-badge" value={v.badge} onChange={(e) => set('badge', e.target.value)} placeholder="예: 4 COLOR" style={field} />
        </label>
      </div>
      <label style={label}>상품 설명
        <textarea id="pe-desc" value={v.description} onChange={(e) => set('description', e.target.value)} style={{ ...field, minHeight: 90 }} />
      </label>

      {/* 사진 */}
      <div style={{ display: 'grid', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>사진 {uploading && <span style={{ color: '#888', fontWeight: 400 }}>· 올리는 중…</span>}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {v.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.image} alt="대표 사진" style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover', border: '2px solid #111' }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: 12, background: '#f4f1ee', display: 'grid', placeItems: 'center', fontSize: 12, color: '#999' }}>대표 사진</div>
          )}
          <label style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
            대표 사진 올리기
            <input type="file" accept="image/*" onChange={(e) => void handleUpload(e, 'main')} style={{ display: 'none' }} />
          </label>
          {v.images.map((img, idx) => (
            <div key={img} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`상세 사진 ${idx + 1}`} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid #eee' }} />
              <button type="button" onClick={() => set('images', v.images.filter((x) => x !== img))} aria-label="사진 빼기"
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 0, background: '#e5484d', color: '#fff', fontSize: 13, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <label style={{ width: 60, height: 60, borderRadius: 10, border: '1px dashed #bbb', display: 'grid', placeItems: 'center', fontSize: 22, color: '#999', cursor: 'pointer' }} aria-label="상세 사진 추가">
            +
            <input type="file" accept="image/*" multiple onChange={(e) => void handleUpload(e, 'extra')} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* 일반 고객 판매 */}
      <section style={box}>
        <b style={{ fontSize: 14 }}>일반 고객 판매</b>
        <div role="radiogroup" aria-label="일반 판매 방식" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(CONSUMER_MODE_LABEL) as ConsumerMode[]).map((m) => (
            <label key={m} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: v.consumerMode === m ? '2px solid #111' : '1px solid #ddd' }}>
              <input type="radio" name="pe-mode" checked={v.consumerMode === m} onChange={() => set('consumerMode', m)} />
              {CONSUMER_MODE_LABEL[m]}
            </label>
          ))}
        </div>
        {v.consumerMode !== 'none' && (
          <div style={grid}>
            <label style={label}>정가 (원)
              <input id="pe-consumer" type="number" inputMode="numeric" min={0} value={v.consumerPrice || ''} onChange={(e) => set('consumerPrice', Number(e.target.value))} style={field} />
            </label>
            <label style={label}>{v.consumerMode === 'groupbuy' ? '공구가' : '할인가'} (원, 비우면 정가)
              <input id="pe-discount" type="number" inputMode="numeric" min={0} value={v.discountPrice || ''} onChange={(e) => set('discountPrice', Number(e.target.value))} style={field} />
            </label>
            {v.consumerMode === 'groupbuy' && (
              <>
                <label style={label}>공구 마감 일시
                  <input id="pe-ends" type="datetime-local" value={v.groupbuyEndsAt} onChange={(e) => set('groupbuyEndsAt', e.target.value)} style={field} />
                </label>
                <label style={label}>목표 수량 (선택)
                  <input id="pe-target" type="number" inputMode="numeric" min={0} value={v.groupbuyTarget || ''} onChange={(e) => set('groupbuyTarget', Number(e.target.value))} style={field} />
                </label>
              </>
            )}
          </div>
        )}
      </section>

      {/* 도매 판매 */}
      <section style={box}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 800 }}>
          <input id="pe-ws" type="checkbox" checked={v.wholesaleEnabled} onChange={(e) => set('wholesaleEnabled', e.target.checked)} />
          사업자에게 도매로도 팔기
        </label>
        {v.wholesaleEnabled && (
          <>
            <div style={grid}>
              <label style={label}>도매가 (원)
                <input id="pe-ws-price" type="number" inputMode="numeric" min={0} value={v.wholesalePrice || ''} onChange={(e) => set('wholesalePrice', Number(e.target.value))} style={field} />
              </label>
              <label style={label}>최소 주문 수량
                <input id="pe-ws-min" type="number" inputMode="numeric" min={1} value={v.wholesaleMinQty} onChange={(e) => set('wholesaleMinQty', Math.max(1, Number(e.target.value)))} style={field} />
              </label>
              <label style={label}>주문 단위 (몇 개씩)
                <input id="pe-ws-unit" type="number" inputMode="numeric" min={1} value={v.wholesaleUnit} onChange={(e) => set('wholesaleUnit', Math.max(1, Number(e.target.value)))} style={field} />
              </label>
              <label style={label}>누구에게 도매로 팔지
                <select id="pe-ws-aud" value={v.wholesaleAudience} onChange={(e) => set('wholesaleAudience', e.target.value as WholesaleAudience)} style={field}>
                  {(Object.keys(AUDIENCE_LABEL) as WholesaleAudience[]).map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]}</option>)}
                </select>
              </label>
            </div>
            <p style={{ fontSize: 12, color: '#888' }}>도매가는 승인된 사업자에게만 서버가 보여줍니다. 일반 고객과 비회원에게는 보이지 않아요.</p>
          </>
        )}
      </section>

      {/* 거래 방식 · 배송 */}
      <section style={box}>
        <b style={{ fontSize: 14 }}>{mode === 'vendor' ? '니니랜드에 납품하는 조건' : '거래 방식 · 배송'}</b>
        {mode === 'admin' && hasVendor && (
          <div role="radiogroup" aria-label="거래 방식" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['commission', 'purchase'] as DealType[]).map((d) => (
              <label key={d} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: v.dealType === d ? '2px solid #111' : '1px solid #ddd' }}>
                <input type="radio" name="pe-deal" checked={v.dealType === d} onChange={() => set('dealType', d)} />
                {DEAL_LABEL[d]}
              </label>
            ))}
          </div>
        )}
        <div style={grid}>
          {mode === 'admin' && hasVendor && v.dealType === 'commission' && (
            <>
              <label style={label}>수수료율 (%)
                <input id="pe-rate" type="number" inputMode="decimal" min={0} max={100} step="0.1" value={v.commissionRate} onChange={(e) => set('commissionRate', Number(e.target.value))} style={field} />
              </label>
              {v.wholesaleEnabled && (
                <label style={label}>도매 판매 수수료율 (%, 비우면 같음)
                  <input id="pe-ws-rate" type="number" inputMode="decimal" min={0} max={100} step="0.1" value={v.wholesaleCommissionRate} onChange={(e) => set('wholesaleCommissionRate', e.target.value)} style={field} />
                </label>
              )}
            </>
          )}
          {(mode === 'vendor' || v.dealType === 'purchase' || !hasVendor) && (
            <label style={label}>{mode === 'vendor' ? '니니랜드 공급가 (사입일 때, 원)' : hasVendor ? '매입가 (도매처에 주는 돈, 원)' : '원가 (선택, 마진 계산용)'}
              <input id="pe-supply" type="number" inputMode="numeric" min={0} value={v.supplyPrice || ''} onChange={(e) => set('supplyPrice', Number(e.target.value))} style={field} />
            </label>
          )}
          {(hasVendor || mode === 'vendor') && (
            <label style={label}>{mode === 'vendor' ? '희망 발송 방식' : '발송'}
              <select id="pe-ful" value={v.fulfillment} onChange={(e) => set('fulfillment', e.target.value as Fulfillment)} style={field}>
                {(Object.keys(FULFILLMENT_LABEL) as Fulfillment[]).map((f) => <option key={f} value={f}>{FULFILLMENT_LABEL[f]}</option>)}
              </select>
            </label>
          )}
        </div>
        {mode === 'vendor' && <p style={{ fontSize: 12, color: '#888' }}>수수료율·거래 방식은 니니랜드와 협의해 검수할 때 정해집니다. 공급가는 사입(매입) 거래일 때 기준이 됩니다.</p>}
        {mode === 'admin' && (consumerPreview || wholesalePreview) && (
          <div style={{ fontSize: 13, background: '#f6faf8', borderRadius: 10, padding: '10px 12px', display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
            {consumerPreview && v.consumerMode !== 'none' && (
              <span>일반 1개 {salePrice(v).toLocaleString()}원 → 니니랜드 <b>{consumerPreview.nini.toLocaleString()}원</b>{hasVendor && <> · 도매처 <b>{consumerPreview.vendor.toLocaleString()}원</b></>}</span>
            )}
            {wholesalePreview && (
              <span>도매 1개 {v.wholesalePrice.toLocaleString()}원 → 니니랜드 <b>{wholesalePreview.nini.toLocaleString()}원</b>{hasVendor && <> · 도매처 <b>{wholesalePreview.vendor.toLocaleString()}원</b></>}</span>
            )}
            {!hasVendor && v.supplyPrice > 0 && v.consumerMode !== 'none' && <span>원가 빼면 1개 마진 {(salePrice(v) - v.supplyPrice).toLocaleString()}원</span>}
          </div>
        )}
      </section>

      {/* 옵션 · 재고 */}
      <section style={{ ...box, borderStyle: 'dashed' }}>
        <b style={{ fontSize: 14 }}>옵션 · 재고</b>
        <div style={grid}>
          <label style={label}>컬러 (쉼표로 구분)
            <input id="pe-colors" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} onBlur={applyOptions} placeholder="예: 핑크, 블루" style={field} />
          </label>
          <label style={label}>사이즈 (쉼표로 구분)
            <input id="pe-sizes" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} onBlur={applyOptions} placeholder="예: 5호, 7호, 9호" style={field} />
          </label>
          <label style={label}>새 옵션 기본 재고
            <input id="pe-defstock" type="number" min={0} value={defaultStock} onChange={(e) => setDefaultStock(Number(e.target.value))} style={field} />
          </label>
        </div>
        <p style={{ fontSize: 12, color: '#888' }}>재고 0인 옵션은 품절로 표시되고 주문이 막힙니다. 주문받고 발주하는 공구는 넉넉히(999) 두면 됩니다.</p>
        {v.options.length > 0 && sizes.length > 0 && (
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
                {v.options.map((option) => (
                  <tr key={option.color} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
                      <input type="color" value={option.colorHex} aria-label={`${option.color} 색상`}
                        onChange={(e) => set('options', v.options.map((o) => (o.color === option.color ? { ...o, colorHex: e.target.value } : o)))}
                        style={{ width: 22, height: 22, border: 0, padding: 0, verticalAlign: 'middle', marginRight: 6 }} />
                      {option.color}
                    </td>
                    {option.sizes.map((s) => (
                      <td key={s.size} style={{ padding: 4 }}>
                        <input type="number" min={0} value={s.stock} aria-label={`${option.color} ${s.size} 재고`}
                          onChange={(e) => setStock(option.color, s.size, Math.max(0, Number(e.target.value)))}
                          style={{ width: 62, border: '1px solid #ddd', borderRadius: 8, padding: 6, fontSize: 13, background: s.stock <= 0 ? '#fff0f0' : '#fff' }} />
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
      </section>

      {/* 고시 정보 */}
      <details style={box} open={!v.kcCert}>
        <summary style={{ fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>상품정보 고시 · KC 인증 (아동복 필수)</summary>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={label}>KC 인증번호
            <input id="pe-kc" value={v.kcCert} onChange={(e) => set('kcCert', e.target.value)} placeholder="예: CB063R1234-5001" style={field} />
          </label>
          <div style={grid}>
            <label style={label}>소재<input id="pe-material" value={v.material} onChange={(e) => set('material', e.target.value)} style={field} /></label>
            <label style={label}>제조국<input id="pe-madein" value={v.madeIn} onChange={(e) => set('madeIn', e.target.value)} style={field} /></label>
            <label style={label}>제조사(자)<input id="pe-maker" value={v.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} style={field} /></label>
            <label style={label}>사이즈 안내<input id="pe-sizeguide" value={v.sizeGuide} onChange={(e) => set('sizeGuide', e.target.value)} style={field} /></label>
          </div>
          <label style={label}>세탁 방법<input id="pe-wash" value={v.washGuide} onChange={(e) => set('washGuide', e.target.value)} style={field} /></label>
          <label style={label}>취급 주의사항<input id="pe-caution" value={v.precautions} onChange={(e) => set('precautions', e.target.value)} style={field} /></label>
          <label style={label}>출고 안내<input id="pe-shipnote" value={v.shippingNote} onChange={(e) => set('shippingNote', e.target.value)} style={field} /></label>
        </div>
      </details>

      {mode === 'admin' && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 700 }}>
          <input id="pe-active" type="checkbox" checked={v.active} onChange={(e) => set('active', e.target.checked)} />
          판매 개시 (손님 화면에 보이기)
        </label>
      )}

      {shownError && <p style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#fff0f0', color: '#c93442' }}>{shownError}</p>}
      {message?.tone === 'ok' && <p style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#eef8f2', color: '#2f6f4f' }}>{message.text}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={busy || uploading} style={{ flex: 1, border: 0, borderRadius: 12, padding: '13px 14px', background: '#111', color: '#fff', fontWeight: 800, fontSize: 15 }}>
          {busy ? '저장 중…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ border: '1px solid #ddd', borderRadius: 12, padding: '12px 14px', background: '#fff' }}>취소</button>
        )}
      </div>
    </form>
  );
}
