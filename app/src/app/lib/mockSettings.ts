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
}

export const initialSettings: StoreSettings = {
  heroTitle: '니니랜드가 직접 만든 유아봇',
  heroDescription: '우리 아이 첫 로봇 친구, 니니랜드 유아봇을 만나보세요.',
  heroBadge: 'NEW',
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
