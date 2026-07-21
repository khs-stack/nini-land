'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Product, products as initialProducts } from './mockProducts';

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
  details: Record<string, any>;
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
  createdAt: string;
  items: CartItem[];
  total: number;
  shippingFee: number;
  role: UserRole;
  recipient: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
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
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  updateProfile: (data: Partial<Omit<User, 'id' | 'role'>>) => void;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string, wholesaleRequested: boolean) => void;
  logout: () => void;
  setDemoRole: (role: UserRole) => void;
  addToCart: (product: Product, role: UserRole, options?: { color?: string; size?: string; quantity?: number }) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  removeFromCart: (cartKey: string) => void;
  createOrder: (recipient: string, shippingFee: number, phone?: string) => OrderSummary | null;
  createProduct: (product: Omit<Product, 'id' | 'slug'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addReview: (productId: string, rating: number, content: string) => void;
  createCER: (orderId: string, type: CancelExchangeReturnType, reason: string, details: Record<string, any>) => void;
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

const MockStoreContext = createContext<MockStoreContextValue | undefined>(undefined);

function resolveRole(email: string) {
  if (email.includes('admin')) return 'admin';
  if (email.includes('wholesale')) return 'wholesale_approved';
  if (email.includes('pending')) return 'wholesale_pending';
  return 'member';
}

function createSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');
}

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cers, setCers] = useState<CancelExchangeReturn[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 'ann-1', title: '뉘니랜드 오픈 안내', content: '새로운 쇼핑몰을 오픈했습니다. 많은 이용 부탁드립니다.', createdAt: new Date().toISOString() },
  ]);
  const [popups, setPopups] = useState<Popup[]>([
    { id: 'popup-1', title: '신규 오픈 이벤트', content: '신규 회원 가입 시 5,000원 할인 쿠폰을 드립니다!', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), visible: true },
  ]);
  const [members, setMembers] = useState<MemberRecord[]>([
    { id: 'mem-1', name: '김소매', email: 'kim@example.com', role: 'member', joinedAt: '2026-06-01' },
    { id: 'mem-2', name: '이도매', email: 'wholesale@example.com', role: 'wholesale_approved', companyName: '이도매상사', businessRegNumber: '123-45-67890', joinedAt: '2026-05-20' },
    { id: 'mem-3', name: '박신청', email: 'pending@example.com', role: 'wholesale_pending', companyName: '박신청유통', businessRegNumber: '222-33-44555', joinedAt: '2026-07-10' },
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 'addr-1', label: '집', recipient: '홍길동', phone: '010-1234-5678', address: '서울시 강남구 테헤란로 123', isDefault: true },
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('nini-mock-store');
    if (stored) {
      const parsed = JSON.parse(stored) as {
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
      };
      setUser(parsed.user ?? defaultUser);
      setProducts(parsed.products ?? initialProducts);
      setCartItems(parsed.cartItems ?? []);
      setOrders(parsed.orders ?? []);
      setReviews(parsed.reviews ?? []);
      setCers(parsed.cers ?? []);
      setAnnouncements(parsed.announcements ?? announcements);
      setPopups(parsed.popups ?? popups);
      setMembers(parsed.members ?? members);
      setWishlist(parsed.wishlist ?? []);
      setRecentlyViewed(parsed.recentlyViewed ?? []);
      setAddresses(parsed.addresses ?? addresses);
    } else {
      setProducts(initialProducts);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const payload = { user, products, cartItems, orders, reviews, cers, announcements, popups, members, wishlist, addresses, recentlyViewed };
    window.localStorage.setItem('nini-mock-store', JSON.stringify(payload));
  }, [hydrated, user, products, cartItems, orders, reviews, cers, announcements, popups, members, wishlist, addresses, recentlyViewed]);

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

  const login = (email: string, password: string) => {
    if (!email || !password) return;
    const role = resolveRole(email);
    setUser({ id: `${role}-${Date.now()}`, name: email.split('@')[0], role, email });
    setCartItems([]);
  };

  const signup = (name: string, email: string, password: string, wholesaleRequested: boolean) => {
    if (!name || !email || !password) return;
    const role = wholesaleRequested ? 'wholesale_pending' : 'member';
    setUser({ id: `user-${Date.now()}`, name, role, email });
    setCartItems([]);
  };

  const logout = () => {
    setUser(defaultUser);
    setCartItems([]);
  };

  const setDemoRole = (role: UserRole) => {
    setUser((current) => ({ ...current, role }));
  };

  const addToCart = (product: Product, role: UserRole, options?: { color?: string; size?: string; quantity?: number }) => {
    const priceType = role === 'wholesale_approved' || role === 'admin' ? 'wholesale' : 'consumer';
    const unitPrice = priceType === 'wholesale' ? product.wholesalePrice : (product.discountPrice || product.consumerPrice);
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
        .map((item) => (item.cartKey === cartKey ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartKey: string) => {
    setCartItems((current) => current.filter((item) => item.cartKey !== cartKey));
  };

  const createOrder = (recipient: string, shippingFee: number, phone: string = '') => {
    if (!cartItems.length) return null;
    const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) + shippingFee;
    const order: OrderSummary = {
      id: `order-${Date.now()}`,
      createdAt: new Date().toLocaleString('ko-KR'),
      items: cartItems,
      total,
      shippingFee,
      role: user.role,
      recipient,
      phone,
      status: 'confirmed',
    };
    setOrders((current) => [order, ...current]);
    setCartItems([]);
    return order;
  };

  const createProduct = (product: Omit<Product, 'id' | 'slug'>) => {
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
      slug: createSlug(product.name),
    };
    setProducts((current) => [newProduct, ...current]);
  };

  const updateProduct = (product: Product) => {
    setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
  };

  const deleteProduct = (id: string) => {
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const addReview = (productId: string, rating: number, content: string) => {
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
  };

  const createCER = (orderId: string, type: CancelExchangeReturnType, reason: string, details: Record<string, any>) => {
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
  };

  const rejectMember = (id: string) => {
    setMembers((current) => current.map((item) => (item.id === id ? { ...item, role: 'member' } : item)));
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
    createCER,
    updateCERStatus,
    updateOrderStatus,
    addAnnouncement,
    deleteAnnouncement,
    addPopup,
    updatePopup,
    deletePopup,
    isAdmin: user.role === 'admin',
    isWholesaleApproved: user.role === 'wholesale_approved' || user.role === 'admin',
  }), [user, products, cartItems, orders, reviews, cers, announcements, popups, members, wishlist, addresses, recentlyViewed]);

  return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

export function useMockStore() {
  const context = useContext(MockStoreContext);
  if (!context) {
    throw new Error('useMockStore must be used inside MockStoreProvider');
  }
  return context;
}
