import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Product } from './mockProducts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** 환경변수가 없으면(로컬 목업 모드) null. 이때는 mock 데이터로만 동작한다. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const PRODUCT_IMAGE_BUCKET = 'product-images';

export interface ProductRow {
  id: string;
  slug: string;
  data: Product;
  active: boolean;
  groupbuy_ends_at: string | null;
  sort: number;
}

export function rowToProduct(row: ProductRow): Product {
  return {
    ...row.data,
    id: row.id,
    slug: row.slug,
    active: row.active,
    groupbuyEndsAt: row.groupbuy_ends_at,
    sort: row.sort,
  };
}

export function productToRow(product: Product): Omit<ProductRow, 'sort'> & { sort?: number } {
  // 원가·도매 조건은 손님이 읽을 수 있는 data에 넣지 않는다 (별도 비공개 테이블로 옮길 예정).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { active, groupbuyEndsAt, sort, wholesalePrice, recommendedRetailPrice, wholesalePriceConfirmed, minOrderQty, orderUnit, mixOrderAllowed, vatIncluded, ...data } = product;
  return {
    id: product.id,
    slug: product.slug,
    data: data as Product,
    active: active !== false,
    groupbuy_ends_at: groupbuyEndsAt || null,
    ...(typeof sort === 'number' ? { sort } : {}),
  };
}

/** Supabase RPC 에러를 손님에게 보여줄 한 줄 문장으로 바꾼다. */
export function friendlyError(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message?.trim();
  if (!message) return fallback;
  if (/fetch|network|Failed to fetch/i.test(message)) return '인터넷 연결을 확인한 뒤 다시 시도해주세요.';
  return message;
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string) {
  const d = normalizePhone(phone);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export type OrderStatus = 'awaiting_deposit' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_deposit: '입금 대기',
  paid: '입금 확인',
  preparing: '발주·상품 준비중',
  shipped: '배송중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
};

export interface GuestOrderItem {
  productId: string;
  name: string;
  color?: string | null;
  size?: string | null;
  image?: string | null;
  unitPrice: number;
  quantity: number;
}

export interface GuestOrder {
  orderNo: string;
  status: OrderStatus;
  recipient: string;
  phone: string;
  address: string;
  memo?: string | null;
  depositorName: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  courier?: string | null;
  trackingNo?: string | null;
  cancelRequestedAt?: string | null;
  createdAt: string;
  paidAt?: string | null;
  shippedAt?: string | null;
  items: GuestOrderItem[];
}

/** 손님 기기에 남겨두는 "내 주문" 목록. 회원가입 없이도 다시 찾아볼 수 있게 한다. */
const MY_ORDERS_KEY = 'nini-my-orders';

export interface SavedOrderRef {
  orderNo: string;
  phone: string;
  total: number;
  createdAt: string;
}

export function loadSavedOrders(): SavedOrderRef[] {
  try {
    const raw = window.localStorage.getItem(MY_ORDERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedOrderRef[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrderRef(ref: SavedOrderRef) {
  try {
    const next = [ref, ...loadSavedOrders().filter((item) => item.orderNo !== ref.orderNo)].slice(0, 30);
    window.localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(next));
  } catch {
    /* 저장이 막힌 브라우저에서도 주문 자체는 정상 처리된다 */
  }
}

/** 택배사별 배송조회 링크. 송장번호를 붙여 새 창으로 연다. */
export const COURIERS: Array<{ name: string; trackUrl: (no: string) => string }> = [
  { name: 'CJ대한통운', trackUrl: (no) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(no)}` },
  { name: '우체국택배', trackUrl: (no) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(no)}` },
  { name: '한진택배', trackUrl: (no) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${encodeURIComponent(no)}` },
  { name: '롯데택배', trackUrl: (no) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(no)}` },
  { name: '로젠택배', trackUrl: (no) => `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(no)}` },
  { name: 'GS편의점택배', trackUrl: (no) => `https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=${encodeURIComponent(no)}` },
];

export function trackingUrl(courier?: string | null, trackingNo?: string | null) {
  if (!courier || !trackingNo) return null;
  return COURIERS.find((c) => c.name === courier)?.trackUrl(trackingNo) ?? null;
}
