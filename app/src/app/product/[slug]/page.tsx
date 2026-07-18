'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { getProductBySlug } from "../../lib/mockProducts";
import { useMockStore } from "../../lib/mockStore";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug as string);
  const { user, addToCart, reviews, addReview } = useMockStore();
  const [toast, setToast] = useState(false);

  if (!product) {
    return <main style={{ padding: 24 }}>상품을 찾을 수 없습니다.</main>;
  }

  const handleAddToCart = () => {
    addToCart(product, user.role);
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

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
            {(user.role === 'wholesale_approved' || user.role === 'admin') && (
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid #e8e8e8" }}>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>승인된 도매회원</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#0f7a4f" }}>{product.wholesalePrice.toLocaleString()}원</div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
                  권장 소비자가 {product.recommendedRetailPrice.toLocaleString()}원 · 최소주문 {product.minOrderQty}개 · 주문단위 {product.orderUnit}개
                </div>
              </div>
            )}
          </div>
          {user.role !== 'wholesale_approved' && user.role !== 'admin' && (
            <p style={{ marginTop: 12, fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              현재 표시된 가격은 일반 소비자 판매가격입니다. 사업자 회원은 인증 및 관리자 승인 후 별도의 도매가를 확인할 수 있습니다.{' '}
              <Link href="/auth/signup-wholesale" style={{ color: '#2f6fed', fontWeight: 700 }}>사업자 회원가입 →</Link>
            </p>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            style={{ marginTop: 16, width: '100%', border: 0, borderRadius: 12, padding: '14px', background: '#111', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
          >
            장바구니 담기
          </button>
          {toast && (
            <div style={{ marginTop: 10, textAlign: 'center', background: '#0f7a4f', color: 'white', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 600 }}>
              장바구니에 담았습니다 🛒
            </div>
          )}
        </section>

        <ReviewSection productId={product.id} reviews={reviews} onSubmit={addReview} />
      </div>
    </main>
  );
}

function ReviewSection({
  productId,
  reviews,
  onSubmit,
}: {
  productId: string;
  reviews: { id: string; productId: string; userName: string; rating: number; content: string; createdAt: string }[];
  onSubmit: (productId: string, rating: number, content: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [sort, setSort] = useState<'recent' | 'rating'>('recent');
  const [showForm, setShowForm] = useState(false);

  const productReviews = useMemo(() => {
    const filtered = reviews.filter((review) => review.productId === productId);
    return [...filtered].sort((a, b) =>
      sort === 'recent' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.rating - a.rating
    );
  }, [reviews, productId, sort]);

  const average = useMemo(() => {
    if (!productReviews.length) return 0;
    return productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  }, [productReviews]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    onSubmit(productId, rating, content.trim());
    setContent('');
    setRating(5);
    setShowForm(false);
  };

  return (
    <section style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>
          상품 리뷰 {productReviews.length > 0 && <span style={{ color: '#a26500' }}>⭐ {average.toFixed(1)} ({productReviews.length})</span>}
        </h2>
        {productReviews.length > 1 && (
          <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'rating')} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
            <option value="recent">최신순</option>
            <option value="rating">평점순</option>
          </select>
        )}
      </div>

      {productReviews.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", background: "#f9f9f9", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>첫 리뷰를 남겨보세요</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {productReviews.map((review) => (
            <div key={review.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{review.userName}</span>
                <span>{'⭐'.repeat(review.rating)}</span>
              </div>
              <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} style={{
          width: '100%', padding: "12px 20px", background: "#ff6b6b", color: "#fff", border: "none",
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          리뷰 작성하기
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} style={{ border: 0, background: 'none', fontSize: 22, cursor: 'pointer', opacity: n <= rating ? 1 : 0.3 }}>⭐</button>
            ))}
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="상품 사용 후기를 남겨주세요" style={{ border: '1px solid #ddd', borderRadius: 12, padding: '10px 12px', minHeight: 70 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, border: 0, borderRadius: 10, padding: '10px', background: '#111', color: 'white', fontWeight: 700 }}>등록</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 16px', background: '#fff' }}>취소</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 16, fontSize: 13, color: "#666", textAlign: "center" }}>
        구매 확인된 회원만 리뷰 작성이 가능합니다.
      </div>
    </section>
  );
}
