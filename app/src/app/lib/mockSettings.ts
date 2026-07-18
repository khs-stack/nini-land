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
  kakaoId: string;
  openChatUrl: string;
  naverPlaceUrl: string;
  smartstoreUrl: string;
  naverTalktalkUrl: string;
}

export const initialSettings: StoreSettings = {
  heroTitle: '한눈에 보는 시즌 베스트 아이템',
  heroDescription: '소비자와 도매회원이 각각 다른 가격 흐름을 확인할 수 있는 쇼핑몰 경험을 미리 체험해보세요.',
  heroBadge: '공구 기간 한정 혜택',
  contactPhone: '02-1234-5678',
  contactEmail: 'support@nini-land.example',
  companyName: '(주) 니니랜드',
  businessNumber: '123-45-67890',
  representative: '홍길동',
  address: '서울시 강남구 테헤란로 1길 1, 1층',
  kakaoId: 'nini_land',
  openChatUrl: 'https://open.kakao.com/o/example',
  naverPlaceUrl: 'https://map.naver.com/p/search/니니랜드',
  smartstoreUrl: 'https://smartstore.naver.com/example',
  naverTalktalkUrl: 'https://talk.naver.com/example',
};
