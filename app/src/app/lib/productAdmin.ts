import { editorToPayDiscounts, editorToProductData, fromLocalInput, type EditorValue } from '../components/ProductEditor';
import type { DealType } from './mockProducts';
import { supabase } from './supabase';

export interface PrivateTerms {
  wholesale: { price: number; min_qty: number; order_unit: number } | null;
  costs: { supply_price: number; deal_type: DealType; commission_rate: number; wholesale_commission_rate: number | null } | null;
  friend?: { price: number; card_rate: number; bank_rate: number } | null;
}

/** 관리자·해당 도매처만 읽을 수 있는 도매 조건과 거래 조건 */
export async function loadPrivateTerms(productId: string): Promise<PrivateTerms> {
  if (!supabase) return { wholesale: null, costs: null, friend: null };
  const [ws, costs, friend] = await Promise.all([
    supabase.from('product_wholesale').select('price, min_qty, order_unit').eq('product_id', productId).maybeSingle(),
    supabase.from('product_costs').select('supply_price, deal_type, commission_rate, wholesale_commission_rate').eq('product_id', productId).maybeSingle(),
    supabase.from('product_friend').select('price, card_rate, bank_rate').eq('product_id', productId).maybeSingle(),
  ]);
  return { wholesale: ws.data ?? null, costs: (costs.data as PrivateTerms['costs']) ?? null, friend: (friend.data as PrivateTerms['friend']) ?? null };
}

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
  return `${base}-${Date.now().toString(36)}`;
}

/** 관리자 저장: 공개 상품 + 도매 조건 + 거래 조건을 한 번에 */
export async function saveAdminProduct(
  v: EditorValue,
  existing: { id: string; slug: string; vendorId?: string | null; sort?: number } | null,
  nextSort: number
): Promise<{ error?: string; id?: string }> {
  if (!supabase) return { error: '저장소에 연결되지 않았습니다.' };
  const id = existing?.id ?? slugify(v.name);
  const slug = existing?.slug ?? id;
  const hasVendor = Boolean(existing?.vendorId);
  const row = {
    id,
    slug,
    data: { ...editorToProductData(v), id, slug },
    active: v.active,
    groupbuy_ends_at: v.consumerMode === 'groupbuy' ? fromLocalInput(v.groupbuyEndsAt) : null,
    consumer_mode: v.consumerMode,
    wholesale_enabled: v.wholesaleEnabled,
    wholesale_audience: v.wholesaleAudience,
    fulfillment: hasVendor ? v.fulfillment : 'nini',
    pay_discounts: editorToPayDiscounts(v),
    ...(existing ? {} : { sort: nextSort }),
  };
  const productRes = existing
    ? await supabase.from('products').update(row).eq('id', id)
    : await supabase.from('products').insert(row);
  if (productRes.error) return { error: productRes.error.message };

  if (v.wholesaleEnabled && v.wholesalePrice > 0) {
    const { error } = await supabase.from('product_wholesale').upsert({
      product_id: id, price: Math.round(v.wholesalePrice), min_qty: Math.max(1, v.wholesaleMinQty), order_unit: Math.max(1, v.wholesaleUnit),
    });
    if (error) return { error: `도매 조건 저장 실패: ${error.message}` };
  } else {
    await supabase.from('product_wholesale').delete().eq('product_id', id);
  }

  if (v.friendEnabled && v.friendPrice > 0) {
    const r = (n: number) => Math.min(Math.max(Number(n) || 0, 0), 100);
    const { error } = await supabase.from('product_friend').upsert({
      product_id: id, price: Math.round(v.friendPrice), card_rate: r(v.friendCardRate), bank_rate: r(v.friendBankRate),
    });
    if (error) return { error: `지인가 저장 실패: ${error.message}` };
  } else {
    await supabase.from('product_friend').delete().eq('product_id', id);
  }

  const { error: costError } = await supabase.from('product_costs').upsert({
    product_id: id,
    supply_price: Math.max(0, Math.round(v.supplyPrice || 0)),
    deal_type: hasVendor ? v.dealType : 'own',
    commission_rate: hasVendor && v.dealType === 'commission' ? v.commissionRate : 0,
    wholesale_commission_rate: hasVendor && v.dealType === 'commission' && v.wholesaleCommissionRate !== '' ? Number(v.wholesaleCommissionRate) : null,
  });
  if (costError) return { error: `거래 조건 저장 실패: ${costError.message}` };
  return { id };
}

/** 도매처 신청서 payload (검수 승인 때 approve_submission이 그대로 반영) */
export function editorToSubmission(v: EditorValue) {
  return {
    data: editorToProductData(v),
    consumerMode: v.consumerMode,
    groupbuyEndsAt: v.consumerMode === 'groupbuy' ? fromLocalInput(v.groupbuyEndsAt) : null,
    wholesaleEnabled: v.wholesaleEnabled,
    wholesaleAudience: v.wholesaleAudience,
    wholesale: v.wholesaleEnabled ? { price: Math.round(v.wholesalePrice), minQty: v.wholesaleMinQty, orderUnit: v.wholesaleUnit } : null,
    supplyPrice: Math.max(0, Math.round(v.supplyPrice || 0)),
    fulfillment: v.fulfillment,
  };
}
