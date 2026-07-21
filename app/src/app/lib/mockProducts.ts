export interface SizeStock {
  size: string;
  stock: number;
}

export interface ColorOption {
  color: string;
  colorHex: string;
  image?: string;
  sizes: SizeStock[];
}

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  images?: string[];
  material?: string;
  madeIn?: string;
  manufacturer?: string;
  washGuide?: string;
  precautions?: string;
  productCode?: string;
  season?: string;
  sizeGuide?: string;
  shippingNote?: string;
  consumerPrice: number;
  discountPrice: number;
  wholesalePrice: number;
  recommendedRetailPrice: number;
  minOrderQty: number;
  orderUnit: number;
  mixOrderAllowed?: boolean;
  vatIncluded?: boolean;
  badge: string;
  options?: ColorOption[];
};

const imageRoot = '/products/2026-collection';

const stock = (entries: Array<[string, number]>): SizeStock[] =>
  entries.map(([size, quantity]) => ({ size, stock: quantity }));

const kidsSizes = [
  ['3호(XS)', 16],
  ['5호(S)', 20],
  ['7호(M)', 18],
  ['9호(L)', 14],
  ['11호(XL)', 10],
] as Array<[string, number]>;

export const products: Product[] = [
  {
    id: 'roka-sleeveless-set',
    slug: 'roka-sleeveless-set',
    name: '로카나시세트',
    category: '신상품',
    description: '블랙 디지털 패턴으로 완성한 민소매 상하세트입니다. 가볍고 활동성이 좋아 여름 데일리룩과 주니어 형제룩으로 함께 제안하기 좋습니다. 주니어 사이즈도 추가금 없이 동일한 도매가로 주문할 수 있습니다.',
    image: `${imageRoot}/kory-set-01.webp`,
    images: [
      `${imageRoot}/kory-set-01.webp`,
      `${imageRoot}/kory-set-02.webp`,
      `${imageRoot}/kory-set-03.webp`,
    ],
    material: '면 혼방',
    madeIn: '대한민국',
    manufacturer: 'NiNi Land 협력 생산처',
    washGuide: '찬물 단독 세탁, 프린트 부분을 뒤집어 세탁, 건조기 사용 금지',
    precautions: '진한 색상은 첫 세탁 시 이염 가능성이 있어 밝은 색상과 분리 세탁해 주세요.',
    productCode: 'NN-ROKA-001',
    season: 'SUMMER',
    sizeGuide: 'S · M · L · XL · 2XL · 3XL · 4XL (주니어 추가금 없음)',
    shippingNote: '재고 보유 옵션은 결제 확인 후 순차 출고되며, 품절 옵션은 개별 안내드립니다.',
    consumerPrice: 19000,
    discountPrice: 19000,
    wholesalePrice: 14000,
    recommendedRetailPrice: 19000,
    minOrderQty: 3,
    orderUnit: 1,
    mixOrderAllowed: true,
    vatIncluded: false,
    badge: '주니어 동일가',
    options: [
      {
        color: '블랙 디지털',
        colorHex: '#151515',
        image: `${imageRoot}/kory-set-02.webp`,
        sizes: stock([
          ['S', 14], ['M', 18], ['L', 18], ['XL', 15], ['2XL', 11], ['3XL', 8], ['4XL', 6],
        ]),
      },
    ],
  },
  {
    id: 'look-and-me-set',
    slug: 'look-and-me-set',
    name: '룩앤미세트',
    category: '베스트',
    description: '상의 기준 노랑·핑크·오렌지·블루 네 가지 컬러로 구성된 배색 상하세트입니다. 컬러가 선명하고 착용 사진이 풍부해 온라인 상세페이지와 매장 메인 진열 상품으로 활용하기 좋습니다.',
    image: `${imageRoot}/smile-model-yellow-front.webp`,
    images: [
      `${imageRoot}/smile-model-yellow-front.webp`,
      `${imageRoot}/smile-model-yellow-back.webp`,
      `${imageRoot}/smile-set-yellow.webp`,
      `${imageRoot}/smile-set-pink.webp`,
      `${imageRoot}/smile-model-pink-baby.webp`,
      `${imageRoot}/smile-model-pink-close.webp`,
      `${imageRoot}/smile-set-orange.webp`,
      `${imageRoot}/smile-set-blue.webp`,
      `${imageRoot}/smile-group-01.webp`,
      `${imageRoot}/smile-group-02.webp`,
    ],
    material: '면 95%, 스판 5%',
    madeIn: '대한민국',
    manufacturer: 'NiNi Land 협력 생산처',
    washGuide: '30도 이하 약한 세탁, 세탁망 사용, 자연 건조 권장',
    precautions: '배색 원단 특성상 장시간 물에 담가두지 말고 단독 세탁해 주세요.',
    productCode: 'NN-LOOK-001',
    season: 'SUMMER',
    sizeGuide: '3호(XS) · 5호(S) · 7호(M) · 9호(L) · 11호(XL)',
    shippingNote: '동일 상품 컬러·사이즈 혼합 주문이 가능하며 재고 소진 시 리오더로 전환될 수 있습니다.',
    consumerPrice: 22900,
    discountPrice: 22900,
    wholesalePrice: 14000,
    recommendedRetailPrice: 22900,
    minOrderQty: 3,
    orderUnit: 1,
    mixOrderAllowed: true,
    vatIncluded: false,
    badge: '4 COLOR',
    options: [
      { color: '노랑', colorHex: '#f3c928', image: `${imageRoot}/smile-set-yellow.webp`, sizes: stock(kidsSizes) },
      { color: '핑크', colorHex: '#e95a97', image: `${imageRoot}/smile-set-pink.webp`, sizes: stock([['3호(XS)', 12], ['5호(S)', 18], ['7호(M)', 17], ['9호(L)', 13], ['11호(XL)', 8]]) },
      { color: '오렌지', colorHex: '#ef8b2c', image: `${imageRoot}/smile-set-orange.webp`, sizes: stock([['3호(XS)', 10], ['5호(S)', 16], ['7호(M)', 15], ['9호(L)', 12], ['11호(XL)', 7]]) },
      { color: '블루', colorHex: '#63bfd4', image: `${imageRoot}/smile-set-blue.webp`, sizes: stock([['3호(XS)', 11], ['5호(S)', 17], ['7호(M)', 16], ['9호(L)', 12], ['11호(XL)', 9]]) },
    ],
  },
  {
    id: '2025-eojjeol-kimjang-set',
    slug: '2025-eojjeol-kimjang-set',
    name: '2025 어쩔김장룩 상하세트',
    category: '공구상품',
    description: '니니랜드 특유의 빈티지 꽃 패턴을 담은 시즌 한정 김장룩 상하세트입니다. 가볍게 누빈 원단으로 실내외 레이어드가 쉽고, 김장철·겨울 시즌 콘텐츠 상품으로 활용하기 좋습니다.',
    image: `${imageRoot}/kimjang-flower-outdoor.webp`,
    images: [
      `${imageRoot}/kimjang-flower-outdoor.webp`,
      `${imageRoot}/kimjang-flower-back.webp`,
      `${imageRoot}/kimjang-flower-baby.webp`,
      `${imageRoot}/kimjang-flower-close.webp`,
      `${imageRoot}/kimjang-flower-play-01.webp`,
      `${imageRoot}/kimjang-flower-play-02.webp`,
      `${imageRoot}/kimjang-flower-lineup.webp`,
    ],
    material: '겉감 면 100%, 충전재 폴리에스터 100%',
    madeIn: '대한민국',
    manufacturer: 'NiNi Land',
    washGuide: '중성세제로 찬물 손세탁, 비틀어 짜지 말고 그늘 건조',
    precautions: '패턴 배치는 재단 위치에 따라 상품마다 다를 수 있으며 건조기 사용을 피해주세요.',
    productCode: 'NN-KIMJANG-SET',
    season: '2025 FALL/WINTER',
    sizeGuide: '3호(XS) · 5호(S) · 7호(M) · 9호(L) · 11호(XL)',
    shippingNote: '공구 마감 후 생산되는 상품으로 주문량에 따라 출고일이 변동될 수 있습니다.',
    consumerPrice: 34000,
    discountPrice: 34000,
    wholesalePrice: 22000,
    recommendedRetailPrice: 34000,
    minOrderQty: 2,
    orderUnit: 1,
    mixOrderAllowed: true,
    vatIncluded: false,
    badge: '공구 진행중',
    options: [
      { color: '레드', colorHex: '#9f3e45', image: `${imageRoot}/kimjang-flower-lineup.webp`, sizes: stock(kidsSizes) },
      { color: '네이비', colorHex: '#303e59', image: `${imageRoot}/kimjang-flower-outdoor.webp`, sizes: stock([['3호(XS)', 10], ['5호(S)', 15], ['7호(M)', 14], ['9호(L)', 10], ['11호(XL)', 6]]) },
      { color: '블랙', colorHex: '#222222', image: `${imageRoot}/kimjang-flower-back.webp`, sizes: stock([['3호(XS)', 9], ['5호(S)', 13], ['7호(M)', 12], ['9호(L)', 8], ['11호(XL)', 5]]) },
    ],
  },
  {
    id: '2025-eojjeol-kimjang-bonnet-set',
    slug: '2025-eojjeol-kimjang-bonnet-set',
    name: '2025 어쩔김장룩 보넷세트',
    category: '공구상품',
    description: '어쩔김장룩 상하 구성에 보넷을 더한 풀 코디 세트입니다. 촬영용 스타일링을 한 번에 완성할 수 있어 온라인 판매 이미지와 시즌 기획전 대표 상품으로 추천합니다.',
    image: `${imageRoot}/kimjang-flower-vest.webp`,
    images: [
      `${imageRoot}/kimjang-flower-vest.webp`,
      `${imageRoot}/kimjang-flower-close.webp`,
      `${imageRoot}/kimjang-flower-play-01.webp`,
      `${imageRoot}/kimjang-flower-play-02.webp`,
      `${imageRoot}/kimjang-flower-baby.webp`,
      `${imageRoot}/kimjang-flower-outdoor.webp`,
      `${imageRoot}/kimjang-flower-lineup.webp`,
    ],
    material: '겉감 면 100%, 충전재 폴리에스터 100%',
    madeIn: '대한민국',
    manufacturer: 'NiNi Land',
    washGuide: '중성세제로 찬물 손세탁, 보넷은 형태를 잡아 그늘 건조',
    precautions: '보넷 끈은 보호자가 확인한 상태에서 착용해 주세요. 패턴 위치는 상품마다 다를 수 있습니다.',
    productCode: 'NN-KIMJANG-BONNET',
    season: '2025 FALL/WINTER',
    sizeGuide: '3호(XS) · 5호(S) · 7호(M) · 9호(L) · 11호(XL)',
    shippingNote: '상하세트와 보넷이 함께 출고되며, 공구 마감 후 생산 일정에 따라 순차 배송됩니다.',
    consumerPrice: 42000,
    discountPrice: 42000,
    wholesalePrice: 27000,
    recommendedRetailPrice: 42000,
    minOrderQty: 2,
    orderUnit: 1,
    mixOrderAllowed: true,
    vatIncluded: false,
    badge: '보넷세트',
    options: [
      { color: '레드', colorHex: '#9f3e45', image: `${imageRoot}/kimjang-flower-lineup.webp`, sizes: stock([['3호(XS)', 10], ['5호(S)', 14], ['7호(M)', 13], ['9호(L)', 9], ['11호(XL)', 5]]) },
      { color: '네이비', colorHex: '#303e59', image: `${imageRoot}/kimjang-flower-outdoor.webp`, sizes: stock([['3호(XS)', 8], ['5호(S)', 12], ['7호(M)', 11], ['9호(L)', 8], ['11호(XL)', 4]]) },
      { color: '블랙', colorHex: '#222222', image: `${imageRoot}/kimjang-flower-vest.webp`, sizes: stock([['3호(XS)', 7], ['5호(S)', 11], ['7호(M)', 10], ['9호(L)', 7], ['11호(XL)', 4]]) },
    ],
  },
  {
    id: 'lego-homewear',
    slug: 'lego-homewear',
    name: '레고실내복',
    category: '베스트',
    description: '배색 골지 원단과 편안한 실루엣으로 구성한 레고실내복입니다. 상의 기준 브릭·머스타드·핑크·올리브 네 가지 컬러로 형제자매 시밀러룩과 컬러별 세트 진열에 적합합니다.',
    image: `${imageRoot}/block-homewear-red-01.webp`,
    images: [
      `${imageRoot}/block-homewear-red-01.webp`,
      `${imageRoot}/block-homewear-red-02.webp`,
      `${imageRoot}/block-homewear-models.webp`,
      `${imageRoot}/block-homewear-hanger.webp`,
      `${imageRoot}/block-homewear-colors.webp`,
      `${imageRoot}/block-homewear-guide.webp`,
    ],
    material: '면 95%, 스판 5% 골지',
    madeIn: '대한민국',
    manufacturer: 'NiNi Land 협력 생산처',
    washGuide: '세탁망 사용, 30도 이하 약한 세탁, 자연 건조',
    precautions: '신축성 있는 골지 원단으로 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.',
    productCode: 'NN-LEGO-001',
    season: '2025 FALL',
    sizeGuide: '3호(XS) · 5호(S) · 7호(M) · 9호(L) · 11호(XL)',
    shippingNote: '컬러·사이즈 혼합 주문 가능하며 품절 옵션은 다음 생산차수에 합배송될 수 있습니다.',
    consumerPrice: 17000,
    discountPrice: 17000,
    wholesalePrice: 10000,
    recommendedRetailPrice: 17000,
    minOrderQty: 3,
    orderUnit: 1,
    mixOrderAllowed: true,
    vatIncluded: false,
    badge: '4 COLOR',
    options: [
      { color: '브릭', colorHex: '#a94f3d', image: `${imageRoot}/block-homewear-red-01.webp`, sizes: stock(kidsSizes) },
      { color: '머스타드', colorHex: '#b77a2c', image: `${imageRoot}/block-homewear-models.webp`, sizes: stock([['3호(XS)', 13], ['5호(S)', 18], ['7호(M)', 17], ['9호(L)', 12], ['11호(XL)', 8]]) },
      { color: '핑크', colorHex: '#c98491', image: `${imageRoot}/block-homewear-hanger.webp`, sizes: stock([['3호(XS)', 12], ['5호(S)', 17], ['7호(M)', 15], ['9호(L)', 11], ['11호(XL)', 7]]) },
      { color: '올리브', colorHex: '#738269', image: `${imageRoot}/block-homewear-colors.webp`, sizes: stock([['3호(XS)', 11], ['5호(S)', 16], ['7호(M)', 14], ['9호(L)', 10], ['11호(XL)', 6]]) },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
