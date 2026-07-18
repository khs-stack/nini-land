import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug } from "../../lib/mockProducts";

type Props = {
  params: Promise<{ slug: string }>;
};

function ProductDetailContent({ slug }: { slug: string }) {
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f7f7f7", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 16 }}>
        <Link href="/" style={{ color: "#2f6fed", fontWeight: 600 }}>
          ← 홈으로
        </Link>

        <section style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>{product.category}</span>
            <span style={{ background: "#fff2d6", color: "#a26500", padding: "6px 10px", borderRadius: 999, fontSize: 12 }}>{product.badge}</span>
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{product.name}</h1>
          <p style={{ color: "#666", lineHeight: 1.6 }}>{product.description}</p>
        </section>

        <section style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>가격 정보</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, background: "#f7f7f7" }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>일반 소비자</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{product.consumerPrice.toLocaleString()}원</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid #e8e8e8" }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>승인된 도매회원</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f7a4f" }}>{product.wholesalePrice.toLocaleString()}원</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
                권장 소비자가 {product.recommendedRetailPrice.toLocaleString()}원 · 최소주문 {product.minOrderQty}개 · 주문단위 {product.orderUnit}개
              </div>
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 14, color: "#666", lineHeight: 1.6 }}>
            현재 표시된 가격은 일반 소비자 판매가격입니다. 사업자 회원은 인증 및 관리자 승인 후 별도의 도매가를 확인할 수 있습니다.
          </p>
        </section>

        <ReviewSection productId={product.id} />
      </div>
    </main>
  );
}

function ReviewSection({ productId }: { productId: string }) {
  return (
    <section style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>상품 리뷰</h2>
      
      <div style={{ padding: 20, textAlign: "center", background: "#f9f9f9", borderRadius: 12 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>첫 리뷰를 남겨보세요</div>
        <button style={{
          padding: "10px 20px",
          background: "#ff6b6b",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}>
          리뷰 작성하기
        </button>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: "#666", textAlign: "center" }}>
        구매 확인된 회원만 리뷰 작성이 가능합니다.
      </div>
    </section>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <Suspense fallback={<div style={{ padding: "40px 16px", textAlign: "center" }}>로딩 중...</div>}>
      <ProductDetailContent slug={slug} />
    </Suspense>
  );
}
