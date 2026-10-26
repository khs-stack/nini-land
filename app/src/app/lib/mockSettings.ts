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
}

export const initialSettings: StoreSettings = {
  heroTitle: '엄마들이 먼저 찾는 아동복 공구',
  heroDescription: '도매처에서 바로 가져와 공구가로 한 번에. 마감 후 일괄 주문해 순차 발송합니다.',
  heroBadge: '공구 기간 한정가',
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
};

/** 화면에서 판단하는 "주문 받는 중" 여부. 서버 store_is_open()과 같은 규칙. */
export function isStoreOpen(settings: StoreSettings) {
  return Boolean(settings.storeOpen && settings.bankAccount.trim() && settings.businessNumber.trim());
}

/** 사이트 기능 스위치. 도매회원 기능은 지우지 않고 숨겨둔다 (docs/DECISIONS.md 참고). */
export const WHOLESALE_ENABLED = false;
