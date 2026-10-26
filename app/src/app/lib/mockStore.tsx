'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type Product, products as initialProducts, salePrice } from './mockProducts';
import { initialSettings, type StoreSettings, WHOLESALE_ENABLED } from './mockSettings';
import { friendlyError, productToRow, rowToProduct, saveOrderRef, supabase, type ProductRow } from './supabase';

export type UserRole = 'guest' | 'member' | 'wholesale_pending' | 'wholesale_approved' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  companyName?: string;
  businessRegNumber?: string;
  businessAddress?: string;
}

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  image: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  priceType: 'consumer' | 'wholesale';
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export type CancelExchangeReturnType = 'cancel' | 'exchange' | 'return';
export type CERStatus = 'requested' | 'approved' | 'rejected' | 'completed';

export interface CancelExchangeReturn {
  id: string;
  orderId: string;
  type: CancelExchangeReturnType;
  reason: string;
  status: CERStatus;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export interface MemberRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  businessRegNumber?: string;
  joinedAt: string;
}

export interface SignupBusinessInfo {
  companyName?: string;
  businessRegNumber?: string;
  businessAddress?: string;
  phone?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Popup {
  id: string;
  title: string;
  content: string;
  image?: string;
  startDate: string;
  endDate: string;
  visible: boolean;
}

export interface OrderSummary {
  id: string;
  userId: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  shippingFee: number;
  role: UserRole;
  recipient: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  subtotal?: number;
  discount?: number;
  address?: string;
  memo?: string;
  paymentMethod?: 'card' | 'bank';
}

export interface CreateOrderInput {
  recipient: string;
  phone: string;
  address: string;
  memo?: string;
  depositorName: string;
}

export interface PlacedOrder {
  orderNo: string;
  phone: string;
  subtotal: number;
  shippingFee: number;
  total: number;
}

export interface CreateOrderResult {
  order: PlacedOrder | null;
  /** 주문 생성에 실패한 이유. 성공 시 undefined. */
  error?: string;
}

export interface ActionResult {
  error?: string;
}

interface MockStoreContextValue {
  user: User;
  products: Product[];
  cartItems: CartItem[];
  orders: OrderSummary[];
  reviews: Review[];
  cers: CancelExchangeReturn[];
  announcements: Announcement[];
  popups: Popup[];
  members: MemberRecord[];
  approveMember: (id: string) => void;
  rejectMember: (id: string) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
  addresses: Address[];
  settings: StoreSettings;
  updateSettings: (next: Partial<StoreSettings>) => Promise<ActionResult>;
  /** 상품·설정을 DB에서 처음 불러왔는지 */
  catalogLoaded: boolean;
  /** 상품별 공구 주문 수량(취소 제외) */
  groupbuyCounts: Record<string, number>;
  refreshCatalog: () => Promise<void>;
  /** 로그인 상태 확인이 끝났는지 (관리자 화면 깜빡임 방지) */
  authChecked: boolean;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  updateProfile: (data: Partial<Omit<User, 'id' | 'role'>>) => void;
  login: (email: string, password: string) => Promise<ActionResult>;
  signup: (name: string, email: string, password: string, wholesaleRequested: boolean, businessInfo?: SignupBusinessInfo) => void;
  logout: () => Promise<void>;
  setDemoRole: (role: UserRole) => void;
  addToCart: (product: Product, role: UserRole, options?: { color?: string; size?: string; quantity?: number }) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  removeFromCart: (cartKey: string) => void;
  createOrder: (input: CreateOrderInput) => Promise<CreateOrderResult>;
  createProduct: (product: Omit<Product, 'id' | 'slug'>) => Promise<ActionResult>;
  updateProduct: (product: Product) => Promise<ActionResult>;
  deleteProduct: (id: string) => Promise<ActionResult>;
  addReview: (productId: string, rating: number, content: string) => boolean;
  hasPurchased: (productId: string) => boolean;
  createCER: (orderId: string, type: CancelExchangeReturnType, reason: string, details: Record<string, unknown>) => void;
  updateCERStatus: (cerId: string, status: CERStatus) => void;
  addAnnouncement: (title: string, content: string) => void;
  deleteAnnouncement: (id: string) => void;
  addPopup: (title: string, content: string, startDate: string, endDate: string) => void;
  updatePopup: (id: string, data: Partial<Popup>) => void;
  deletePopup: (id: string) => void;
  updateOrderStatus: (orderId: string, status: OrderSummary['status']) => void;
  isAdmin: boolean;
  isWholesaleApproved: boolean;
}

const defaultUser: User = { id: 'guest', name: '게스트', role: 'guest', email: '' };
const MOCK_STORE_VERSION = 7; // v7: 상품·설정·주문을 Supabase로 이전, 장바구니 등 개인 데이터만 브라우저에 저장
const DEFAULT_POPUP_START = new Date().toISOString();
const DEFAULT_POPUP_END = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

/** 무료배송 기준과 기본 배송비. 여러 화면에서 각자 계산하지 않도록 단일 소스로 관리한다. */
export const FREE_SHIPPING_THRESHOLD = 50000;
export const STANDARD_SHIPPING_FEE = 3000;
export function calculateShippingFee(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
}

/**
 * 운영 배포에서 반드시 꺼져 있어야 하는 데모 기능 게이트.
 * .env.local에서 명시적으로 'true'로 켜지 않는 한 항상 꺼진 상태(false)로 동작한다(fail-closed).
 */
export const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';
export const DEMO_ROLES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_ROLES === 'true';

const MockStoreContext = createContext<MockStoreContextValue | undefined>(undefined);

function resolveRole(email: string) {
  if (email.includes('admin')) return 'admin';
  if (email.includes('wholesale')) return 'wholesale_approved';
  if (email.includes('pending')) return 'wholesale_pending';
  return 'member';
}

function createSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
  return `${base}-${Date.now().toString(36)}`;
}

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [products, setProducts] = useState<Product[]>(supabase ? [] : initialProducts);
  const [catalogLoaded, setCatalogLoaded] = useState(!supabase);
  const [groupbuyCounts, setGroupbuyCounts] = useState<Record<string, number>>({});
  const [authChecked, setAuthChecked] = useState(!supabase);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cers, setCers] = useState<CancelExchangeReturn[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(supabase ? [] : [
    { id: 'ann-1', title: '니니랜드 도매 상품 업데이트', content: '레고실내복, 룩앤미세트, 어쩔김장룩, 로카나시세트의 실제 판매 사진과 옵션이 반영되었습니다.', createdAt: new Date().toISOString() },
  ]);
  const [popups, setPopups] = useState<Popup[]>(supabase ? [] : [
    { id: 'popup-1', title: '사업자 회원 안내', content: '사업자 인증 승인 후 공급가·권장소비자가·최소주문수량을 확인할 수 있습니다.', startDate: DEFAULT_POPUP_START, endDate: DEFAULT_POPUP_END, visible: true },
  ]);
  const [members, setMembers] = useState<MemberRecord[]>(supabase ? [] : [
    { id: 'mem-1', name: '김소매', email: 'kim@example.com', role: 'member', joinedAt: '2026-06-01' },
    { id: 'mem-2', name: '이도매', email: 'wholesale@example.com', role: 'wholesale_approved', companyName: '이도매상사', businessRegNumber: '123-45-67890', joinedAt: '2026-05-20' },
    { id: 'mem-3', name: '박신청', email: 'pending@example.com', role: 'wholesale_pending', companyName: '박신청유통', businessRegNumber: '222-33-44555', joinedAt: '2026-07-10' },
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>(supabase ? [] : [
    { id: 'addr-1', label: '집', recipient: '홍길동', phone: '010-1234-5678', address: '서울시 강남구 테헤란로 123', isDefault: true },
  ]);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);

  /* LocalStorage hydration intentionally restores several related state slices together. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('nini-mock-store');

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          version?: number;
          user?: User;
          products?: Product[];
          cartItems?: CartItem[];
          orders?: OrderSummary[];
          reviews?: Review[];
          cers?: CancelExchangeReturn[];
          announcements?: Announcement[];
          popups?: Popup[];
          members?: MemberRecord[];
          wishlist?: string[];
          recentlyViewed?: string[];
          addresses?: Address[];
          settings?: StoreSettings;
        };
        const isCurrentSeed = parsed.version === MOCK_STORE_VERSION;

        setCartItems(isCurrentSeed ? (parsed.cartItems ?? []) : []);
        setWishlist(isCurrentSeed ? (parsed.wishlist ?? []) : []);
        setRecentlyViewed(isCurrentSeed ? (parsed.recentlyViewed ?? []) : []);
        setAddresses(isCurrentSeed ? (parsed.addresses ?? addresses) : addresses);
        if (!supabase) {
          // 로컬 목업 모드에서만 나머지 데이터를 브라우저에 보관한다.
          setUser(parsed.user ?? defaultUser);
          setProducts(isCurrentSeed ? (parsed.products ?? initialProducts) : initialProducts);
          setOrders(isCurrentSeed ? (parsed.orders ?? []) : []);
          setReviews(parsed.reviews ?? []);
          setCers(parsed.cers ?? []);
          setAnnouncements(parsed.announcements ?? announcements);
          setPopups(isCurrentSeed ? (parsed.popups ?? popups) : popups);
          setMembers(parsed.members ?? members);
          setSettings({ ...initialSettings, ...(parsed.settings ?? {}) });
        }
      } catch {
        window.localStorage.removeItem('nini-mock-store');
        setProducts(initialProducts);
      }
    }

    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const personal = { version: MOCK_STORE_VERSION, cartItems, wishlist, addresses, recentlyViewed };
    const payload = supabase
      ? personal
      : { ...personal, user, products, orders, reviews, cers, announcements, popups, members, settings };
    try {
      window.localStorage.setItem('nini-mock-store', JSON.stringify(payload));
    } catch {
      /* 저장공간이 막힌 브라우저에서는 새로고침 시 장바구니가 비워질 뿐 동작에는 문제 없다 */
    }
  }, [hydrated, user, products, cartItems, orders, reviews, cers, announcements, popups, members, wishlist, addresses, recentlyViewed, settings]);

  const refreshCatalog = useCallback(async () => {
    if (!supabase) return;
    const [productRes, settingsRes, countRes] = await Promise.all([
      supabase.from('products').select('id, slug, data, active, groupbuy_ends_at, sort').order('sort').order('created_at', { ascending: false }),
      supabase.from('store_settings').select('data').eq('id', 1).maybeSingle(),
      supabase.rpc('groupbuy_counts'),
    ]);
    if (!productRes.error && productRes.data) {
      setProducts((productRes.data as ProductRow[]).map(rowToProduct));
    }
    if (!settingsRes.error && settingsRes.data) {
      setSettings({ ...initialSettings, ...(settingsRes.data.data as Partial<StoreSettings>) });
    }
    if (!countRes.error && countRes.data) {
      const counts: Record<string, number> = {};
      for (const row of countRes.data as Array<{ product_id: string; quantity: number }>) counts[row.product_id] = Number(row.quantity);
      setGroupbuyCounts(counts);
    }
    setCatalogLoaded(true);
  }, []);

  useEffect(() => {
    // 첫 화면에서 상품·설정을 DB에서 불러온다. setState는 응답이 온 뒤 비동기로 일어난다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCatalog();
  }, [refreshCatalog]);

  // 관리자 로그인 상태 복원
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    const applySession = async (sessionUser: { id: string; email?: string } | null) => {
      if (!sessionUser) {
        if (!cancelled) {
          setUser(defaultUser);
          setAuthChecked(true);
        }
        return;
      }
      const { data: isAdminResult } = await client.rpc('is_admin');
      if (cancelled) return;
      setUser({
        id: sessionUser.id,
        name: isAdminResult ? '관리자' : (sessionUser.email ?? '').split('@')[0],
        role: isAdminResult ? 'admin' : 'member',
        email: sessionUser.email ?? '',
      });
      setAuthChecked(true);
      if (isAdminResult) void refreshCatalog(); // 관리자는 숨김 상품까지 다시 불러온다
    };
    void client.auth.getSession().then(({ data }) => applySession(data.session?.user ?? null));
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void applySession(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [refreshCatalog]);

  const updateSettings = async (next: Partial<StoreSettings>): Promise<ActionResult> => {
    const merged = { ...settings, ...next };
    if (supabase) {
      const { error } = await supabase.from('store_settings').upsert({ id: 1, data: merged });
      if (error) return { error: friendlyError(error, '설정을 저장하지 못했습니다.') };
    }
    setSettings(merged);
    return {};
  };

  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewed((current) => [productId, ...current.filter((id) => id !== productId)].slice(0, 20));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  const addAddress = (address: Omit<Address, 'id'>) => {
    setAddresses((current) => {
      const next = { ...address, id: `addr-${Date.now()}` };
      const updated = address.isDefault ? current.map((a) => ({ ...a, isDefault: false })) : current;
      return [...updated, next];
    });
  };

  const updateAddress = (id: string, data: Partial<Address>) => {
    setAddresses((current) => {
      const updated = data.isDefault ? current.map((a) => ({ ...a, isDefault: false })) : current;
      return updated.map((a) => (a.id === id ? { ...a, ...data } : a));
    });
  };

  const deleteAddress = (id: string) => {
    setAddresses((current) => current.filter((a) => a.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((current) => current.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const updateProfile = (data: Partial<Omit<User, 'id' | 'role'>>) => {
    setUser((current) => ({ ...current, ...data }));
  };

  const login = async (email: string, password: string): Promise<ActionResult> => {
    if (!email || !password) return { error: '이메일과 비밀번호를 입력해주세요.' };
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        return { error: /invalid/i.test(error.message) ? '이메일 또는 비밀번호가 맞지 않습니다.' : friendlyError(error, '로그인하지 못했습니다.') };
      }
      return {};
    }
    const role = DEMO_LOGIN_ENABLED ? resolveRole(email) : 'member';
    setUser({ id: `${role}-${Date.now()}`, name: email.split('@')[0], role, email });
    setCartItems([]);
    return {};
  };

  const signup = (name: string, email: string, password: string, wholesaleRequested: boolean, businessInfo?: SignupBusinessInfo) => {
    if (!name || !email || !password) return;
    const role: UserRole = wholesaleRequested ? 'wholesale_pending' : 'member';
    const id = `user-${Date.now()}`;
    setUser({
      id,
      name,
      role,
      email,
      phone: businessInfo?.phone,
      companyName: businessInfo?.companyName,
      businessRegNumber: businessInfo?.businessRegNumber,
      businessAddress: businessInfo?.businessAddress,
    });
    setCartItems([]);

    if (wholesaleRequested) {
      // 관리자 회원 관리 화면에서 승인/거절할 수 있도록 승인대기 목록에 함께 등록한다.
      setMembers((current) => [
        {
          id,
          name,
          email,
          role,
          companyName: businessInfo?.companyName,
          businessRegNumber: businessInfo?.businessRegNumber,
          joinedAt: new Date().toISOString().slice(0, 10),
        },
        ...current,
      ]);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(defaultUser);
  };

  const setDemoRole = (role: UserRole) => {
    if (!DEMO_ROLES_ENABLED) return;
    setUser((current) => ({ ...current, role }));
    // 역할이 바뀌면 이전 역할 기준 가격(예: 도매가)이 담긴 장바구니가 남지 않도록 초기화한다.
    setCartItems([]);
  };

  const addToCart = (product: Product, role: UserRole, options?: { color?: string; size?: string; quantity?: number }) => {
    const priceType = WHOLESALE_ENABLED && (role === 'wholesale_approved' || role === 'admin') ? 'wholesale' : 'consumer';
    if (priceType === 'wholesale' && product.wholesalePriceConfirmed === false) {
      // 공급가가 확정되지 않은 상품은 도매가로 장바구니에 담을 수 없다.
      return;
    }
    const unitPrice = priceType === 'wholesale' ? product.wholesalePrice : salePrice(product);
    const color = options?.color;
    const size = options?.size;
    const addQty = options?.quantity ?? 1;
    const cartKey = [product.id, color ?? '', size ?? ''].join('__');
    setCartItems((current) => {
      const existing = current.find((item) => item.cartKey === cartKey);
      if (existing) {
        return current.map((item) => (item.cartKey === cartKey ? { ...item, quantity: item.quantity + addQty, unitPrice } : item));
      }
      return [
        ...current,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          image: (color && product.options?.find((o) => o.color === color)?.image) || product.image,
          color,
          size,
          quantity: addQty,
          unitPrice,
          priceType,
        },
      ];
    });
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.cartKey !== cartKey) return item;
          if (quantity <= 0) return { ...item, quantity };
          const product = products.find((p) => p.id === item.productId);
          if (product && item.priceType === 'wholesale') {
            if (quantity < product.minOrderQty) {
              // 도매 최소주문수량 아래로는 스테퍼로 내릴 수 없다. 삭제는 별도 버튼으로 처리한다.
              return item;
            }
            const unit = product.orderUnit > 0 ? product.orderUnit : 1;
            const roundedToUnit = Math.max(Math.round(quantity / unit) * unit, product.minOrderQty);
            return { ...item, quantity: roundedToUnit };
          }
          return { ...item, quantity };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartKey: string) => {
    setCartItems((current) => current.filter((item) => item.cartKey !== cartKey));
  };

  const createOrder = async (input: CreateOrderInput): Promise<CreateOrderResult> => {
    if (!cartItems.length) {
      return { order: null, error: '장바구니가 비어 있습니다.' };
    }

    if (supabase) {
      // 가격·배송비·공구 마감·품절은 서버(place_order)에서 다시 계산하고 확인한다.
      const { data, error } = await supabase.rpc('place_order', {
        p_items: cartItems.map((item) => ({ productId: item.productId, color: item.color ?? null, size: item.size ?? null, quantity: item.quantity })),
        p_recipient: input.recipient,
        p_phone: input.phone,
        p_address: input.address,
        p_memo: input.memo ?? '',
        p_depositor: input.depositorName,
      });
      if (error || !data) {
        return { order: null, error: friendlyError(error, '주문을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.') };
      }
      const placed = data as { orderNo: string; subtotal: number; shippingFee: number; total: number };
      const order: PlacedOrder = { ...placed, phone: input.phone };
      saveOrderRef({ orderNo: placed.orderNo, phone: input.phone, total: placed.total, createdAt: new Date().toISOString() });
      setCartItems([]);
      void refreshCatalog();
      return { order };
    }

    // 로컬 목업 모드
    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const orderNo = `LOCAL-${Date.now()}`;
    setOrders((current) => [{
      id: orderNo, userId: user.id, createdAt: new Date().toLocaleString('ko-KR'), items: cartItems,
      total: subtotal + shippingFee, subtotal, shippingFee, role: user.role, recipient: input.recipient,
      phone: input.phone, address: input.address, memo: input.memo, paymentMethod: 'bank', status: 'pending',
    }, ...current]);
    setCartItems([]);
    return { order: { orderNo, phone: input.phone, subtotal, shippingFee, total: subtotal + shippingFee } };
  };

  const createProduct = async (product: Omit<Product, 'id' | 'slug'>): Promise<ActionResult> => {
    const slug = createSlug(product.name);
    const newProduct: Product = { ...product, id: slug, slug, sort: products.length };
    if (supabase) {
      const { error } = await supabase.from('products').insert(productToRow(newProduct));
      if (error) return { error: friendlyError(error, '상품을 등록하지 못했습니다.') };
      await refreshCatalog();
      return {};
    }
    setProducts((current) => [newProduct, ...current]);
    return {};
  };

  const updateProduct = async (product: Product): Promise<ActionResult> => {
    if (supabase) {
      const { error } = await supabase.from('products').update(productToRow(product)).eq('id', product.id);
      if (error) return { error: friendlyError(error, '상품을 저장하지 못했습니다.') };
      await refreshCatalog();
      return {};
    }
    setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
    return {};
  };

  const deleteProduct = async (id: string): Promise<ActionResult> => {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) return { error: friendlyError(error, '상품을 삭제하지 못했습니다.') };
      await refreshCatalog();
      return {};
    }
    setProducts((current) => current.filter((item) => item.id !== id));
    return {};
  };

  const hasPurchased = (productId: string) =>
    orders.some((order) => order.userId === user.id && order.items.some((item) => item.productId === productId));

  const addReview = (productId: string, rating: number, content: string) => {
    if (!hasPurchased(productId)) return false;
    const review: Review = {
      id: `review-${Date.now()}`,
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      content,
      createdAt: new Date().toISOString(),
    };
    setReviews((current) => [review, ...current]);
    return true;
  };

  const createCER = (orderId: string, type: CancelExchangeReturnType, reason: string, details: Record<string, unknown>) => {
    const cer: CancelExchangeReturn = {
      id: `cer-${Date.now()}`,
      orderId,
      type,
      reason,
      status: 'requested',
      details,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCers((current) => [cer, ...current]);
  };

  const updateCERStatus = (cerId: string, status: CERStatus) => {
    setCers((current) =>
      current.map((item) => (item.id === cerId ? { ...item, status, updatedAt: new Date().toISOString() } : item))
    );
  };

  const updateOrderStatus = (orderId: string, status: OrderSummary['status']) => {
    setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, status } : item)));
  };

  const approveMember = (id: string) => {
    setMembers((current) => current.map((item) => (item.id === id ? { ...item, role: 'wholesale_approved' } : item)));
    setUser((current) => (current.id === id ? { ...current, role: 'wholesale_approved' } : current));
  };

  const rejectMember = (id: string) => {
    setMembers((current) => current.map((item) => (item.id === id ? { ...item, role: 'member' } : item)));
    setUser((current) => (current.id === id ? { ...current, role: 'member' } : current));
  };

  const addAnnouncement = (title: string, content: string) => {
    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements((current) => [ann, ...current]);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((current) => current.filter((item) => item.id !== id));
  };

  const addPopup = (title: string, content: string, startDate: string, endDate: string) => {
    const popup: Popup = {
      id: `popup-${Date.now()}`,
      title,
      content,
      startDate,
      endDate,
      visible: true,
    };
    setPopups((current) => [popup, ...current]);
  };

  const updatePopup = (id: string, data: Partial<Popup>) => {
    setPopups((current) => current.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deletePopup = (id: string) => {
    setPopups((current) => current.filter((item) => item.id !== id));
  };

  const value = useMemo<MockStoreContextValue>(() => ({
    user,
    products,
    cartItems,
    orders,
    reviews,
    cers,
    announcements,
    popups,
    members,
    approveMember,
    rejectMember,
    wishlist,
    toggleWishlist,
    recentlyViewed,
    addRecentlyViewed,
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    settings,
    updateSettings,
    catalogLoaded,
    groupbuyCounts,
    refreshCatalog,
    authChecked,
    updateProfile,
    login,
    signup,
    logout,
    setDemoRole,
    addToCart,
    updateQuantity,
    removeFromCart,
    createOrder,
    createProduct,
    updateProduct,
    deleteProduct,
    addReview,
    hasPurchased,
    createCER,
    updateCERStatus,
    updateOrderStatus,
    addAnnouncement,
    deleteAnnouncement,
    addPopup,
    updatePopup,
    deletePopup,
    isAdmin: user.role === 'admin',
    isWholesaleApproved: WHOLESALE_ENABLED && (user.role === 'wholesale_approved' || user.role === 'admin'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, products, cartItems, orders, reviews, cers, announcements, popups, members, wishlist, addresses, recentlyViewed, settings, catalogLoaded, groupbuyCounts, authChecked]);

  return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

export function useMockStore() {
  const context = useContext(MockStoreContext);
  if (!context) {
    throw new Error('useMockStore must be used inside MockStoreProvider');
  }
  return context;
}
