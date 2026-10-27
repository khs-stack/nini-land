import { supabase, type OrderStatus } from './supabase';

export interface AdminOrderItem {
  id: number;
  product_id: string;
  product_name: string;
  color: string | null;
  size: string | null;
  image: string | null;
  unit_price: number;
  quantity: number;
  vendor_id?: string | null;
  channel?: 'retail' | 'groupbuy' | 'wholesale';
  fulfillment?: 'nini' | 'vendor';
  vendor_share?: number;
  nini_share?: number;
  supply_price?: number;
}

export interface AdminShipment {
  id: number;
  fulfiller_vendor_id: string | null;
  fulfiller_key: string;
  shipping_fee: number;
  courier: string | null;
  tracking_no: string | null;
  shipped_at: string | null;
  vendors?: { company_name: string } | null;
}

export interface AdminOrder {
  id: string;
  order_no: string;
  status: OrderStatus;
  recipient: string;
  phone: string;
  address: string;
  memo: string | null;
  depositor_name: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  courier: string | null;
  tracking_no: string | null;
  admin_memo: string | null;
  cancel_requested_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  user_id?: string | null;
  buyer_kind?: 'guest' | 'member' | 'business' | 'vendor';
  order_items: AdminOrderItem[];
  order_shipments?: AdminShipment[];
}

export async function fetchAdminOrders(): Promise<{ orders: AdminOrder[]; error?: string }> {
  if (!supabase) return { orders: [] };
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_shipments(*, vendors(company_name))')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return { orders: [], error: error.message };
  return { orders: (data ?? []) as AdminOrder[] };
}

/** 상태를 바꿀 때 해당 시각 컬럼도 함께 기록한다. */
export async function setOrderStatus(ids: string[], status: OrderStatus, extra: Partial<AdminOrder> = {}) {
  if (!supabase || ids.length === 0) return { error: undefined as string | undefined };
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status, ...extra };
  if (status === 'paid') patch.paid_at = now;
  if (status === 'shipped') patch.shipped_at = now;
  if (status === 'cancelled') patch.cancelled_at = now;
  if (status === 'awaiting_deposit') patch.paid_at = null;
  const { error } = await supabase.from('orders').update(patch).in('id', ids);
  return { error: error?.message };
}

/** 출고(보내는 곳) 하나에 송장 입력. 모든 출고에 송장이 들어가면 주문을 '배송중'으로 */
export async function setShipmentTracking(order: AdminOrder, shipmentId: number, courier: string, trackingNo: string) {
  if (!supabase) return { error: undefined as string | undefined };
  const { error } = await supabase.from('order_shipments')
    .update({ courier, tracking_no: trackingNo.trim(), shipped_at: new Date().toISOString() }).eq('id', shipmentId);
  if (error) return { error: error.message };
  const others = (order.order_shipments ?? []).filter((s) => s.id !== shipmentId);
  if (others.every((s) => s.tracking_no) && (order.status === 'paid' || order.status === 'preparing')) {
    return setOrderStatus([order.id], 'shipped');
  }
  return { error: undefined };
}

export async function patchOrder(id: string, patch: Partial<Pick<AdminOrder, 'admin_memo' | 'courier' | 'tracking_no'>>) {
  if (!supabase) return { error: undefined as string | undefined };
  const { error } = await supabase.from('orders').update(patch).eq('id', id);
  return { error: error?.message };
}

/** 엑셀에서 바로 열리는 CSV (한글 깨짐 방지를 위해 BOM 포함) */
export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = '﻿' + rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function optionLabel(item: Pick<AdminOrderItem, 'color' | 'size'>) {
  return [item.color, item.size].filter(Boolean).join(' / ');
}
