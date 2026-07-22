'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getProductBySlug, type Product } from '../../lib/mockProducts';
import { useMockStore } from '../../lib/mockStore';
import styles from './ProductDetail.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const {
    user,
    products,
    addToCart,
    reviews,
    addReview,
    wishlist,
    toggleWishlist,
    addRecentlyViewed,
  } = useMockStore();
  const product = products.find((item) => item.slug === slug) ?? getProductBySlug(slug as string);
  const isWholesale = user.role === 'wholesale_approved' || user.role === 'admin';
  const [toast, setToast] = useState(false);
  const [tab, setTab] = useState<'info' | 'review' | 'qna'>('info');
  const [selectedColor, setSelectedColor] = useState<string | null>(() => product?.options?.[0]?.color ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(() => (isWholesale && product ? product.minOrderQty : 1));
  const [optionError, setOptionError] = useState('');

  useEffect(() => {
    if (product) addRecentlyViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(product.options?.[0]?.color ?? null);
    setSelectedSize(null);
    setQuantity(isWholesale ? product.minOrderQty : 1);
    setOptionError('');
  }, [product?.id, isWholesale]);

  if (!product) {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <p>해당 상품을 더 이상 찾을 수 없습니다. 상품이 개편되어 링크가 변경되었을 수 있어요.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <Link href="/" style={{ color: '#2f6fed', fontWeight: 700 }}>홈으로 가기</Link>
            <Link href="/search" style={{ color: '#2f6fed', fontWeight: 700 }}>전체 상품 보기</Link>
          </div>
        </div>
      </main>
    );
  }

  const liked = wishlist.includes(product.id);
  const hasOptions = !!product.options?.length;
  const activeColorOption = product.options?.find((option) => option.color === selectedColor);
  const primaryImage = activeColorOption?.image || product.image;
  const galleryImages = Array.from(new Set([primaryImage, ...(product.images || [])]));
  const sizeStock = activeColorOption?.sizes.find((size) => size.size === selectedSize)?.stock ?? null;
  const discountRate = product.discountPrice && product.discountPrice < product.consumerPrice
    ? Math.round((1 - product.discountPrice / product.consumerPrice) * 100)
    : 0;
  const recommendedDifference = product.recommendedRetailPrice - product.wholesalePrice;
  const reviewCount = reviews.filter((review) => review.productId === product.id).length;

  const validateSelection = () => {
    setOptionError('');
    if (hasOptions && !selectedColor) {
      setOptionError('컬러를 선택해주세요.');
      return false;
    }
    if (hasOptions && !selectedSize) {
      setOptionError('사이즈를 선택해주세요.');
      return false;
    }
    if (sizeStock !== null && sizeStock <= 0) {
      setOptionError('선택하신 옵션은 품절되었습니다.');
      return false;
    }
    if (isWholesale && quantity < product.minOrderQty) {
      setOptionError(`도매 최소주문수량은 ${product.minOrderQty}장입니다.`);
      return false;
    }
    if (quantity % product.orderUnit !== 0) {
      setOptionError(`주문수량은 ${product.orderUnit}장 단위로 선택해주세요.`);
      return false;
    }
    return true;
  };

  const addSelectedItem = () => {
    addToCart(product, user.role, {
      color: selectedColor ?? undefined,
      size: selectedSize ?? undefined,
      quantity,
    });
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    addSelectedItem();
    setToast(true);
    window.setTimeout(() => setToast(false), 1800);
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    addSelectedItem();
    router.push('/cart');
  };

  const adjustQuantity = (direction: -1 | 1) => {
    const minimum = isWholesale ? product.minOrderQty : 1;
    const next = quantity + direction * product.orderUnit;
    setQuantity(Math.max(minimum, next));
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← 상품 목록으로
        </Link>

        <section className={styles.productCard}>
          <div className={styles.galleryColumn}>
            <ImageGallery key={primaryImage} images={galleryImages} alt={product.name} />
          </div>

          <div className={styles.summaryColumn}>
            <div className={styles.topRow}>
              <span className={styles.category}>{product.category}</span>
              <span className={styles.badge}>{product.badge}</span>
            </div>
            <p className={styles.productCode}>{product.productCode} {product.season && `· ${product.season}`}</p>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.description}>{product.description}</p>

            {isWholesale ? (
              <div className={styles.businessPricePanel}>
                <div className={styles.businessPriceTop}>
                  <div>
                    <span>승인 사업자 공급가</span>
                    <strong>{product.wholesalePrice.toLocaleString()}원</strong>
                    {!product.wholesalePriceConfirmed && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: '#a26500', background: '#fff2d6', padding: '2px 8px', borderRadius: 999 }}>
                        임시 · 확인 필요
                      </span>
                    )}
                  </div>
                  <em>VAT {product.vatIncluded ? '포함' : '별도'}</em>
                </div>
                {!product.wholesalePriceConfirmed && (
                  <p style={{ color: '#a26500', fontSize: 13, marginTop: 4 }}>
                    이 상품의 공급가는 아직 사업자 확정을 받지 않은 임시 값입니다. 실제 주문 전 담당자에게 다시 확인해주세요.
                  </p>
                )}
                <div className={styles.businessFacts}>
                  <div><span>권장 판매가</span><b>{product.recommendedRetailPrice.toLocaleString()}원</b></div>
                  <div><span>판매가 기준 차액</span><b>{recommendedDifference.toLocaleString()}원</b></div>
                  <div><span>최소 주문</span><b>{product.minOrderQty}장</b></div>
                </div>
                <p>수수료·배송비 등 실제 판매 비용은 포함하지 않은 단순 참고 차액입니다.</p>
              </div>
            ) : (
              <div className={styles.consumerPricePanel}>
                <span className={styles.priceLabel}>일반 소비자 판매가</span>
                <div className={styles.priceRow}>
                  {discountRate > 0 && <span className={styles.discountRate}>{discountRate}%</span>}
                  <strong>{(product.discountPrice || product.consumerPrice).toLocaleString()}원</strong>
                  {discountRate > 0 && <del>{product.consumerPrice.toLocaleString()}원</del>}
                </div>
                <div className={styles.wholesaleNotice}>
                  <b>사업자 전용 도매가는 별도입니다.</b>
                  <span>사업자 인증 및 관리자 승인 후 공급가와 권장 판매가를 확인할 수 있습니다.</span>
                  <Link href="/auth/signup-wholesale">사업자 회원 신청 →</Link>
                </div>
              </div>
            )}

            {hasOptions && (
              <div className={styles.optionGroup}>
                <div>
                  <div className={styles.optionHeader}>
                    <span className={styles.optionLabel}>컬러</span>
                    {selectedColor && <span className={styles.selectedOption}>{selectedColor}</span>}
                  </div>
                  <div className={styles.colorRow}>
                    {product.options!.map((option) => (
                      <button
                        key={option.color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(option.color);
                          setSelectedSize(null);
                          setOptionError('');
                        }}
                        className={`${styles.colorButton}${selectedColor === option.color ? ` ${styles.selected}` : ''}`}
                        aria-pressed={selectedColor === option.color}
                      >
                        <span className={styles.colorSwatch} style={{ background: option.colorHex }} aria-hidden="true" />
                        {option.color}
                      </button>
                    ))}
                  </div>
                </div>

                {activeColorOption && (
                  <div>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>사이즈</span>
                      {selectedSize && <span className={styles.selectedOption}>{selectedSize}</span>}
                    </div>
                    <div className={styles.sizeRow}>
                      {activeColorOption.sizes.map((size) => {
                        const soldOut = size.stock <= 0;
                        return (
                          <button
                            key={size.size}
                            type="button"
                            disabled={soldOut}
                            onClick={() => {
                              setSelectedSize(size.size);
                              setOptionError('');
                            }}
                            className={[
                              styles.sizeBtn,
                              selectedSize === size.size ? styles.selected : '',
                              soldOut ? styles.soldOut : '',
                            ].filter(Boolean).join(' ')}
                          >
                            <b>{size.size}</b>
                            <small>{soldOut ? '품절' : `${size.stock}장`}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles.quantityRow}>
              <div>
                <span className={styles.quantityLabel}>주문수량</span>
                <small>{isWholesale ? `최소 ${product.minOrderQty}장 · ${product.orderUnit}장 단위` : `${product.orderUnit}장 단위`}</small>
              </div>
              <div className={styles.quantityControl}>
                <button type="button" onClick={() => adjustQuantity(-1)} className={styles.quantityBtn} aria-label="수량 줄이기">−</button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button type="button" onClick={() => adjustQuantity(1)} className={styles.quantityBtn} aria-label="수량 늘리기">+</button>
              </div>
            </div>

            {product.shippingNote && <p className={styles.shippingNote}>출고 안내 · {product.shippingNote}</p>}
            {optionError && <p className={styles.optionError}>{optionError}</p>}

            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={liked ? '관심상품 해제' : '관심상품 추가'}
                className={styles.likeBtn}
              >
                {liked ? '♥' : '♡'}
              </button>
              <button type="button" onClick={handleAddToCart} className={styles.addToCartBtn}>
                {isWholesale ? `${quantity}장 도매 장바구니 담기` : '장바구니 담기'}
              </button>
              <button type="button" onClick={handleBuyNow} className={styles.buyNowBtn}>
                바로 주문하기
              </button>
            </div>
            {toast && <div className={styles.toast}>선택한 옵션을 장바구니에 담았습니다.</div>}
          </div>
        </section>

        <section className={styles.cardFlush}>
          <div className={styles.tabHeader}>
            {([
              { key: 'info', label: '상세정보' },
              { key: 'review', label: `리뷰 ${reviewCount}` },
              { key: 'qna', label: '상품문의' },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`${styles.tabBtn}${tab === item.key ? ` ${styles.active}` : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.tabBody}>
            {tab === 'info' && <InfoTab product={product} isWholesale={isWholesale} />}
            {tab === 'review' && <ReviewTab productId={product.id} reviews={reviews} onSubmit={addReview} />}
            {tab === 'qna' && <QnaTab productId={product.id} productName={product.name} />}
          </div>
        </section>

        <section className={styles.safeNotice}>
          <span className={styles.safeIcon} aria-hidden="true">✓</span>
          <p className={styles.safeNoticeText}>
            현재는 실제 결제 전 목업 단계입니다. 추후 결제·회원 인증 연동 시 서버에서 주문 금액과 사업자 권한을 다시 검증합니다.{' '}
            <Link href="/privacy" className={styles.inlineLink}>개인정보처리방침</Link>
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
    <div className={styles.gallery}>
      <div className={styles.galleryMainWrap}>
        <Image
          src={list[current]}
          alt={`${alt} 상품 이미지 ${current + 1}`}
          fill
          priority={current === 0}
          sizes="(max-width: 899px) 100vw, 55vw"
          className={styles.galleryMain}
        />
        <span className={styles.imageCounter}>{current + 1} / {list.length}</span>
      </div>
      {list.length > 1 && (
        <div className={styles.galleryThumbs} aria-label="상품 이미지 선택">
          {list.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`${styles.galleryThumbBtn}${index === current ? ` ${styles.active}` : ''}`}
              aria-label={`${index + 1}번째 이미지 보기`}
              aria-pressed={index === current}
            >
              <Image src={image} alt="" fill sizes="76px" className={styles.galleryThumbImg} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTab({ product, isWholesale }: { product: Product; isWholesale: boolean }) {
  const rows = [
    ['상품번호', product.productCode],
    ['시즌', product.season],
    ['사이즈', product.sizeGuide],
    ['소재', product.material],
    ['제조사', product.manufacturer],
    ['제조국', product.madeIn],
    ['세탁방법', product.washGuide],
    ['주의사항', product.precautions],
    ['출고안내', product.shippingNote],
  ].filter(([, value]) => !!value);

  return (
    <div className={styles.infoRows}>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.infoRow}>
          <span className={styles.infoRowLabel}>{label}</span>
          <span className={styles.infoRowValue}>{value}</span>
        </div>
      ))}
      {isWholesale && (
        <div className={styles.infoWholesaleSummary}>
          <b>승인 사업자 주문 조건</b>
          <span>
            최소 {product.minOrderQty}장 · {product.orderUnit}장 단위 · 컬러/사이즈 혼합 {product.mixOrderAllowed ? '가능' : '불가'} · VAT {product.vatIncluded ? '포함' : '별도'}
          </span>
        </div>
      )}
      <p className={styles.infoNote}>
        촬영 환경과 화면 설정에 따라 실제 색상이 다르게 보일 수 있으며, 사이즈는 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.
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

function QnaTab({ productId, productName }: { productId: string; productName: string }) {
  const { inquiries, addInquiry } = useMockStore();
  const [content, setContent] = useState('');
  const [secret, setSecret] = useState(false);
  const productInquiries = inquiries.filter((q) => q.productId === productId);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    addInquiry(productId, content.trim(), secret);
    setContent('');
    setSecret(false);
  };

  return (
    <div>
      <p className={styles.qnaIntro}>
        {productName}에 대해 궁금한 점을 남겨주세요. 빠른 답변은{' '}
        <a href="#" className={styles.inlineLink}>카카오톡 문의</a>를 이용해주세요.
      </p>

      {productInquiries.length === 0 ? (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIcon}>💬</div>
          <div className={styles.emptyText}>등록된 문의가 없습니다</div>
        </div>
      ) : (
        <div className={styles.listGap}>
          {productInquiries.map((q) => (
            <div key={q.id} className={styles.listCard}>
              <div className={styles.listCardTop}>{q.createdAt} {q.secret && '🔒 비공개'}</div>
              <p className={styles.listCardBody}>{q.secret ? '비공개 문의입니다.' : q.content}</p>
              {q.answer && <p className={styles.listCardBody} style={{ marginTop: 6, color: '#2f6fed' }}>답변: {q.answer}</p>}
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
