/** 홈 화면 구역 (관리자 → 홈 화면 꾸미기에서 순서·표시·제목 변경) */
export type HomeSectionKey = 'hero' | 'intro' | 'quickLinks' | 'preorder' | 'regular' | 'wholesale';
export interface HomeSection {
  key: HomeSectionKey;
  visible: boolean;
  title?: string;
  subtitle?: string;
}
export interface QuickLink {
  icon: string;
  label: string;
  sub: string;
  href: string;
}
/** 팝업 (DB store_settings.data.popups 에 저장) */
export interface PopupItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  link?: string;
  linkLabel?: string;
  /** modal: 화면 가운데 팝업창 / bar: 맨 위 띠 공지 */
  style: 'modal' | 'bar';
  startDate: string;
  endDate: string;
  visible: boolean;
}

export const HOME_SECTION_NAMES: Record<HomeSectionKey, string> = {
  hero: '큰 배너 (슬라이드)',
  intro: '브랜드 소개',
  quickLinks: '바로가기 버튼',
  preorder: '한정 예약 상품',
  regular: '상품 목록',
  wholesale: '사업자 도매 안내',
};

export const defaultHomeSections: HomeSection[] = [
  { key: 'hero', visible: true },
  { key: 'intro', visible: true },
  { key: 'quickLinks', visible: true },
  { key: 'preorder', visible: true, title: '한정 예약 판매', subtitle: '마감 전에 주문·입금해주세요' },
  { key: 'regular', visible: true, title: '니니랜드 유아옷', subtitle: '언제든 주문할 수 있어요' },
  { key: 'wholesale', visible: false, title: '사업자 도매관', subtitle: '승인된 사업자 회원에게만 보이는 도매 상품' },
];

/** 저장된 순서를 지키되, 새로 생긴 구역은 뒤에 붙인다 */
export function normalizeHomeSections(list: HomeSection[] | undefined): HomeSection[] {
  const saved = Array.isArray(list) ? list.filter((s) => s && s.key in HOME_SECTION_NAMES) : [];
  const keys = new Set(saved.map((s) => s.key));
  return [...saved, ...defaultHomeSections.filter((s) => !keys.has(s.key))];
}

/** 지금 보여줄 팝업 (노출 켜짐 + 기간 안) */
export function activePopups(list: PopupItem[] | undefined, now = Date.now()) {
  return (list ?? []).filter((p) => p.visible
    && new Date(`${String(p.startDate).slice(0, 10)}T00:00:00+09:00`).getTime() <= now
    && new Date(`${String(p.endDate).slice(0, 10)}T23:59:59+09:00`).getTime() >= now);
}

export interface StoreSettings {
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  contactPhone: string;
  contactEmail: string;
  companyName: string;
  businessNumber: string;
  representative: string;
  address: string;
  /** 통신판매업 신고번호 */
  mailOrderNumber: string;
  /** 개인정보 보호책임자 */
  privacyOfficer: string;
  kakaoId: string;
  openChatUrl: string;
  naverPlaceUrl: string;
  smartstoreUrl: string;
  naverTalktalkUrl: string;
  /** 무통장입금 계좌 */
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  shippingFee: number;
  freeShippingThreshold: number;
  /** 주문 후 몇 시간 안에 입금해야 하는지 (안내 문구용) */
  depositDeadlineHours: number;
  /** 주문 받기 스위치. 사업자번호·계좌가 모두 있어야 실제로 열린다(서버에서도 확인). */
  storeOpen: boolean;
  /** 카드 결제 받기. PG(토스페이먼츠 등) 계약·연결 후에만 켤 것 (서버에서도 확인) */
  cardPaymentEnabled: boolean;
  // ---- 홈 화면 꾸미기 ----
  homeSections: HomeSection[];
  introEyebrow: string;
  /** 브랜드 소개 아래 짧은 장점 줄 (한 줄씩) */
  introBenefits: string[];
  introButtonLabel: string;
  quickLinks: QuickLink[];
  /** 상품이 하나도 없을 때 문구 */
  emptyText: string;
  popups: PopupItem[];
}

/** 홈 화면 꾸미기 화면이 저장하는 칸 (쇼핑몰 설정 화면은 이 칸을 건드리지 않음) */
export const HOME_KEYS = ['heroTitle', 'heroDescription', 'heroBadge', 'homeSections', 'introEyebrow', 'introBenefits', 'introButtonLabel', 'quickLinks', 'emptyText'] as const;

export const initialSettings: StoreSettings = {
  heroTitle: '니니랜드가 직접 만든 유아옷',
  heroDescription: '니니랜드가 직접 디자인하고 만든 우리 아이 옷. 편하고 귀엽게, 매일 입기 좋게.',
  heroBadge: 'NINI LAND ORIGINAL',
  contactPhone: '',
  contactEmail: '',
  companyName: '',
  businessNumber: '',
  representative: '',
  address: '',
  mailOrderNumber: '',
  privacyOfficer: '',
  kakaoId: '',
  openChatUrl: '',
  naverPlaceUrl: '',
  smartstoreUrl: '',
  naverTalktalkUrl: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  shippingFee: 3000,
  freeShippingThreshold: 50000,
  depositDeadlineHours: 24,
  storeOpen: false,
  cardPaymentEnabled: false,
  homeSections: defaultHomeSections,
  introEyebrow: 'NINI LAND ORIGINAL',
  introBenefits: ['직접 디자인·제작한 니니랜드 오리지널', '입금 확인 후 바로 발송', 'KC 어린이제품 안전확인 후 판매'],
  introButtonLabel: '전체 상품 보기',
  quickLinks: [
    { icon: 'KIDS', label: '유아옷', sub: '니니랜드 오리지널', href: '/category/유아옷' },
    { icon: 'PRE', label: '한정 예약', sub: '기간 한정 주문', href: '/groupbuy' },
    { icon: 'NEW', label: '신상품', sub: '새로 나온 옷', href: '/category/신상품' },
  ],
  emptyText: '첫 유아옷을 준비하고 있어요. 곧 공개합니다.',
  popups: [],
};

/** 화면에서 판단하는 "주문 받는 중" 여부. 서버 store_is_open()과 같은 규칙. */
export function isStoreOpen(settings: StoreSettings) {
  return Boolean(settings.storeOpen && settings.bankAccount.trim() && settings.businessNumber.trim());
}

/** 옛 목업용 스위치 (Supabase 연결 시에는 상품별 도매 설정을 따른다). */
export const WHOLESALE_ENABLED = false;

/**
 * 입점 도매처(다른 업체 상품 판매) 기능. 직접 만든 상품만 판매하기로 해 꺼둠 (DECISIONS.md 2026-11-03).
 * 코드·DB는 남겨두고 화면만 숨긴다.
 */
export const VENDOR_MARKETPLACE_ENABLED = false;
