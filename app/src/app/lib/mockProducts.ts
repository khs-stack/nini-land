export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image: string;
  consumerPrice: number;
  discountPrice: number;
  wholesalePrice: number;
  recommendedRetailPrice: number;
  minOrderQty: number;
  orderUnit: number;
  badge: string;
};

export const products: Product[] = [
  {
    id: "nini-spring-set",
    slug: "nini-spring-set",
    name: "니니 에센셜 세트",
    category: "신상품",
    description: "바디라인을 살려주는 부드러운 원단의 아동복 세트입니다.",
    image: "/placeholder-product.svg",
    consumerPrice: 68000,
    discountPrice: 62000,
    wholesalePrice: 54000,
    recommendedRetailPrice: 72000,
    minOrderQty: 10,
    orderUnit: 10,
    badge: "공구 진행 중",
  },
  {
    id: "nini-play-day",
    slug: "nini-play-day",
    name: "니니 플레이 데이",
    category: "베스트",
    description: "활동성 높은 실루엣으로 데일리 코디에 자연스럽게 어울립니다.",
    image: "/placeholder-product.svg",
    consumerPrice: 54000,
    discountPrice: 50000,
    wholesalePrice: 43000,
    recommendedRetailPrice: 58000,
    minOrderQty: 20,
    orderUnit: 10,
    badge: "재입고 예정",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
