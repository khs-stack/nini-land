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
  washGuide?: string;
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

const defaultSizes: SizeStock[] = [
  { size: '90', stock: 12 },
  { size: '100', stock: 8 },
  { size: '110', stock: 0 },
  { size: '120', stock: 5 },
];

export const products: Product[] = [
  {
    id: "nini-spring-set",
    slug: "nini-spring-set",
    name: "니니 에센셜 세트",
    category: "신상품",
    description: "바디라인을 살려주는 부드러운 원단의 아동복 세트입니다.",
    image: "/placeholder-product.svg",
    images: ["/placeholder-product.svg", "/placeholder-product.svg", "/placeholder-product.svg"],
    material: "면 95%, 스판덱스 5%",
    madeIn: "대한민국",
    washGuide: "30도 이하 손세탁 권장, 표백제 사용 금지",
    consumerPrice: 68000,
    discountPrice: 62000,
    wholesalePrice: 54000,
    recommendedRetailPrice: 72000,
    minOrderQty: 10,
    orderUnit: 10,
    mixOrderAllowed: true,
    vatIncluded: true,
    badge: "공구 진행 중",
    options: [
      { color: "핑크", colorHex: "#f6a8c4", image: "/placeholder-product.svg", sizes: defaultSizes },
      { color: "블루", colorHex: "#a9c9f6", image: "/placeholder-product.svg", sizes: [
        { size: '90', stock: 6 }, { size: '100', stock: 0 }, { size: '110', stock: 9 }, { size: '120', stock: 4 },
      ] },
    ],
  },
  {
    id: "nini-play-day",
    slug: "nini-play-day",
    name: "니니 플레이 데이",
    category: "베스트",
    description: "활동성 높은 실루엣으로 데일리 코디에 자연스럽게 어울립니다.",
    image: "/placeholder-product.svg",
    images: ["/placeholder-product.svg", "/placeholder-product.svg"],
    material: "폴리에스터 80%, 면 20%",
    madeIn: "대한민국",
    washGuide: "세탁망 사용, 건조기 사용 금지",
    consumerPrice: 54000,
    discountPrice: 50000,
    wholesalePrice: 43000,
    recommendedRetailPrice: 58000,
    minOrderQty: 20,
    orderUnit: 10,
    mixOrderAllowed: true,
    vatIncluded: true,
    badge: "재입고 예정",
    options: [
      { color: "옐로우", colorHex: "#ffd76b", image: "/placeholder-product.svg", sizes: defaultSizes },
      { color: "그레이", colorHex: "#c7c7c7", image: "/placeholder-product.svg", sizes: defaultSizes },
    ],
  },
  {
    id: "nini-summer-linen",
    slug: "nini-summer-linen",
    name: "니니 여름 린넨 세트",
    category: "신상품",
    description: "통풍이 잘되는 린넨 혼방 소재로 더운 날씨에도 시원하게 입힐 수 있습니다.",
    image: "/placeholder-product.svg",
    images: ["/placeholder-product.svg"],
    material: "린넨 55%, 면 45%",
    madeIn: "베트남",
    washGuide: "찬물 손세탁, 그늘에서 건조",
    consumerPrice: 45000,
    discountPrice: 39000,
    wholesalePrice: 32000,
    recommendedRetailPrice: 48000,
    minOrderQty: 10,
    orderUnit: 5,
    mixOrderAllowed: true,
    vatIncluded: true,
    badge: "신규",
    options: [
      { color: "화이트", colorHex: "#f5f5f0", sizes: defaultSizes },
      { color: "민트", colorHex: "#b6e6d8", sizes: defaultSizes },
    ],
  },
  {
    id: "nini-cozy-fleece",
    slug: "nini-cozy-fleece",
    name: "니니 포근 후리스 세트",
    category: "베스트",
    description: "기모 안감으로 따뜻하고, 활동하기 편한 여유있는 핏입니다.",
    image: "/placeholder-product.svg",
    images: ["/placeholder-product.svg"],
    material: "폴리에스터 100% (기모)",
    madeIn: "대한민국",
    washGuide: "단독 세탁, 약한 탈수",
    consumerPrice: 59000,
    discountPrice: 59000,
    wholesalePrice: 46000,
    recommendedRetailPrice: 63000,
    minOrderQty: 10,
    orderUnit: 10,
    mixOrderAllowed: false,
    vatIncluded: true,
    badge: "베스트",
    options: [
      { color: "네이비", colorHex: "#2b3a55", sizes: defaultSizes },
      { color: "베이지", colorHex: "#e8ddc7", sizes: defaultSizes },
    ],
  },
  {
    id: "nini-groupbuy-dress",
    slug: "nini-groupbuy-dress",
    name: "니니 원피스 공구 특가",
    category: "공구상품",
    description: "이번 공구 기간에만 만나볼 수 있는 한정 원피스입니다.",
    image: "/placeholder-product.svg",
    images: ["/placeholder-product.svg"],
    material: "면 90%, 스판덱스 10%",
    madeIn: "대한민국",
    washGuide: "손세탁 권장",
    consumerPrice: 39000,
    discountPrice: 32000,
    wholesalePrice: 26000,
    recommendedRetailPrice: 42000,
    minOrderQty: 10,
    orderUnit: 10,
    mixOrderAllowed: true,
    vatIncluded: true,
    badge: "공구 진행 중",
    options: [
      { color: "레드", colorHex: "#d84a4a", sizes: defaultSizes },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
