'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getProductBySlug } from "../../lib/mockProducts";
import { useMockStore } from "../../lib/mockStore";
import styles from "./ProductDetail.module.css";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug as string);
  const { user, addToCart, reviews, addReview, wishlist, toggleWishlist, addRecentlyViewed } = useMockStore();
  const [toast, setToast] = useState(false);
  const [tab, setTab] = useState<'info' | 'review' | 'qna'>('info');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [optionError, setOptionError] = useState('');

  useEffect(() => {
    if (product) addRecentlyViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) {
    return <main style={{ padding: 24 }}>상품을 찾을 수 없습니다.</main>;
  }

  const liked = wishlist.includes(product.id);
  const isWholesale = user.role === 'wholesale_approved' || user.role === 'admin';
  const hasOptions = !!product.options?.length;
  const activeColorOption = product.options?.find((o) => o.color === selectedColor);
  const galleryImages = [
    activeColorOption?.image || product.image,
    ...(product.images || []).filter((img) => img !== (activeColorOption?.image || product.image)),
  ];
  const sizeStock = activeColorOption?.sizes.find((s) => s.size === selectedSize)?.stock ?? null;

  const handleAddToCart = () => {
    setOptionError('');
    if (hasOptions && !selectedColor) {
      setOptionError('컬러를 선택해주세요.');
      return;
    }
    if (hasOptions && !selectedSize) {
      setOptionError('사이즈를 선택해주세요.');
      return;
    }
    if (sizeStock !== null && sizeStock <= 0) {
      setOptionError('선택하신 옵션은 품절되었습니다.');
      return;
    }
    if (isWholesale && quantity < product.minOrderQty) {
      setOptionError(`도매 최소주문수량은 ${product.minOrderQty}개입니다.`);
      return;
    }
    addToCart(product, user.role, {
      color: selectedColor ?? undefined,
      size: selectedSize ?? undefined,
      quantity,
    });
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← 홈으로
        </Link>

        <section className={styles.card}>
          <ImageGallery images={galleryImages} alt={product.name} />
          <div className={styles.topRow}>
            <span className={styles.category}>{product.category}</span>
            <span className={styles.badge}>{product.badge}</span>
          </div>
          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.description}>{product.description}</p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>가격 정보</h2>
          <div className={styles.priceBox}>
            <div className={styles.priceLabel}>일반 소비자</div>
            <div className={styles.priceRow}>
              {product.discountPrice && product.discountPrice < product.consumerPrice ? (
                <>
                  <span className={styles.discountRate}>
                    {Math.round((1 - product.discountPrice / product.consumerPrice) * 100)}%
                  </span>
                  <div className={styles.priceMain}>{product.discountPrice.toLocaleString()}원</div>
                  <div className={styles.priceOriginal}>{product.consumerPrice.toLocaleString()}원</div>
                </>
              ) : (
                <div className={styles.priceMain}>{product.consumerPrice.toLocaleString()}원</div>
              )}
            </div>
          </div>
          {isWholesale && (
            <div className={styles.wholesaleBox}>
              <div className={styles.wholesaleLabel}>승인된 도매회원</div>
              <div className={styles.wholesalePrice}>{product.wholesalePrice.toLocaleString()}원</div>
              <div className={styles.wholesaleMeta}>
                권장 소비자가 {product.recommendedRetailPrice.toLocaleString()}원 · 최소주문 {product.minOrderQty}개 · 주문단위 {product.orderUnit}개
                {product.vatIncluded ? ' · 부가세 포함' : ' · 부가세 별도'} · 혼합주문 {product.mixOrderAllowed ? '가능' : '불가'}
              </div>
            </div>
          )}
          {!isWholesale && (
            <p className={styles.wholesaleNotice}>
              현재 표시된 가격은 일반 소비자 판매가격입니다. 사업자 회원은 인증 및 관리자 승인 후 별도의 도매가를 확인할 수 있습니다.{' '}
              <Link href="/auth/signup-wholesale" className={styles.inlineLink}>사업자 회원가입 →</Link>
            </p>
          )}

          {hasOptions && (
            <div className={styles.optionGroup}>
              <div>
                <div className={styles.optionLabel}>컬러</div>
                <div className={styles.colorRow}>
                  {product.options!.map((opt) => (
                    <button
                      key={opt.color}
                      type="button"
                      onClick={() => { setSelectedColor(opt.color); setSelectedSize(null); setOptionError(''); }}
                      title={opt.color}
                      className={`${styles.colorSwatch}${selectedColor === opt.color ? ` ${styles.selected}` : ''}`}
                      style={{ background: opt.colorHex }}
                    >
                      {selectedColor === opt.color && <span className={styles.colorCheck}>✓</span>}
                    </button>
                  ))}
                </div>
                {selectedColor && <div className={styles.selectedColorText}>선택됨: {selectedColor}</div>}
              </div>

              {activeColorOption && (
                <div>
                  <div className={styles.optionLabel}>사이즈</div>
                  <div className={styles.sizeRow}>
                    {activeColorOption.sizes.map((s) => {
                      const soldOut = s.stock <= 0;
                      return (
                        <button
                          key={s.size}
                          type="button"
                          disabled={soldOut}
                          onClick={() => { setSelectedSize(s.size); setOptionError(''); }}
                          className={[
                            styles.sizeBtn,
                            selectedSize === s.size ? styles.selected : '',
                            soldOut ? styles.soldOut : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {s.size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.quantityRow}>
            <span className={styles.quantityLabel}>수량</span>
            <div className={styles.quantityControl}>
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className={styles.quantityBtn}>−</button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className={styles.quantityBtn}>+</button>
            </div>
          </div>

          {optionError && <p className={styles.optionError}>{optionError}</p>}

          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={liked ? '관심상품 해제' : '관심상품 추가'}
              className={styles.likeBtn}
            >
              {liked ? '❤️' : '🤍'}
            </button>
            <button type="button" onClick={handleAddToCart} className={styles.addToCartBtn}>
              장바구니 담기
            </button>
          </div>
          {toast && <div className={styles.toast}>장바구니에 담았습니다 🛒</div>}
        </section>

        <section className={styles.cardFlush}>
          <div className={styles.tabHeader}>
            {([
              { key: 'info', label: '상세정보' },
              { key: 'review', label: `리뷰 ${reviews.filter((r) => r.productId === product.id).length}` },
              { key: 'qna', label: '문의' },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`${styles.tabBtn}${tab === t.key ? ` ${styles.active}` : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.tabBody}>
            {tab === 'info' && <InfoTab product={product} />}
            {tab === 'review' && <ReviewTab productId={product.id} reviews={reviews} onSubmit={addReview} />}
            {tab === 'qna' && <QnaTab productName={product.name} />}
          </div>
        </section>

        <section className={styles.safeNotice}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <p className={styles.safeNoticeText}>
            NiNi Land는 안전한 거래를 위해 결제 정보를 암호화하여 처리하며, 회원님의 개인정보는{' '}
            <Link href="/privacy" className={styles.inlineLink}>개인정보처리방침</Link>에 따라
            안전하게 보호됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : ['/placeholder-product.svg'];
  const current = Math.min(active, list.length - 1);

  return (
    <div>
      <img src={list[current]} alt={alt} className={styles.galleryMain} />
      {list.length > 1 && (
        <div className={styles.galleryThumbs}>
          {list.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className={`${styles.galleryThumbBtn}${index === current ? ` ${styles.active}` : ''}`}
            >
              <img src={img} alt="" className={styles.galleryThumbImg} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTab({ product }: { product: ReturnType<typeof getProductBySlug> }) {
  if (!product) return null;
  const rows = [
    ['소재', product.material],
    ['제조국', product.madeIn],
    ['세탁방법', product.washGuide],
    ['부가세', product.vatIncluded ? '포함' : '별도'],
    ['혼합주문', product.mixOrderAllowed ? '가능' : '불가'],
  ].filter(([, v]) => !!v);

  return (
    <div className={styles.infoRows}>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.infoRow}>
          <span className={styles.infoRowLabel}>{label}</span>
          <span className={styles.infoRowValue}>{value}</span>
        </div>
      ))}
      <p className={styles.infoNote}>
        상품 이미지는 촬영 환경에 따라 실제 색상과 다소 차이가 있을 수 있습니다.
      </p>
    </div>
  );
}

function ReviewTab({
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
    <div>
      <div className={styles.tabTopRow}>
        <div className={styles.reviewSummary}>
          {productReviews.length > 0 ? (
            <span className={styles.reviewAverage}>⭐ {average.toFixed(1)} ({productReviews.length}개 리뷰)</span>
          ) : (
            <span className={styles.reviewEmpty}>등록된 리뷰가 없습니다</span>
          )}
        </div>
        {productReviews.length > 1 && (
          <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'rating')} className={styles.sortSelect}>
            <option value="recent">최신순</option>
            <option value="rating">평점순</option>
          </select>
        )}
      </div>

      {productReviews.length === 0 ? (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIcon}>⭐</div>
          <div className={styles.emptyText}>첫 리뷰를 남겨보세요</div>
        </div>
      ) : (
        <div className={styles.listGap}>
          {productReviews.map((review) => (
            <div key={review.id} className={styles.listCard}>
              <div className={styles.listCardTop}>
                <span className={styles.listCardName}>{review.userName}</span>
                <span>{'⭐'.repeat(review.rating)}</span>
              </div>
              <p className={styles.listCardBody}>{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} className={styles.writeBtn}>
          리뷰 작성하기
        </button>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`${styles.ratingStar}${n <= rating ? ` ${styles.active}` : ''}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="상품 사용 후기를 남겨주세요" className={styles.textarea} />
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>등록</button>
            <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>취소</button>
          </div>
        </form>
      )}

      <div className={styles.footNote}>
        구매 확인된 회원만 리뷰 작성이 가능합니다.
      </div>
    </div>
  );
}

function QnaTab({ productName }: { productName: string }) {
  const [questions, setQuestions] = useState<{ id: string; content: string; createdAt: string; secret: boolean }[]>([]);
  const [content, setContent] = useState('');
  const [secret, setSecret] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    setQuestions((current) => [
      { id: `q-${Date.now()}`, content: content.trim(), createdAt: new Date().toLocaleString('ko-KR'), secret },
      ...current,
    ]);
    setContent('');
    setSecret(false);
  };

  return (
    <div>
      <p className={styles.qnaIntro}>
        {productName}에 대해 궁금한 점을 남겨주세요. 빠른 답변은{' '}
        <a href="#" className={styles.inlineLink}>카카오톡 문의</a>를 이용해주세요.
      </p>

      {questions.length === 0 ? (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIcon}>💬</div>
          <div className={styles.emptyText}>등록된 문의가 없습니다</div>
        </div>
      ) : (
        <div className={styles.listGap}>
          {questions.map((q) => (
            <div key={q.id} className={styles.listCard}>
              <div className={styles.listCardTop}>{q.createdAt} {q.secret && '🔒 비공개'}</div>
              <p className={styles.listCardBody}>{q.secret ? '비공개 문의입니다.' : q.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="문의 내용을 입력해주세요" className={styles.textarea} />
        <label className={styles.qnaSecretLabel}>
          <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
          비공개 문의로 등록
        </label>
        <button type="submit" className={styles.submitBtn}>문의 등록</button>
      </form>
    </div>
  );
}
