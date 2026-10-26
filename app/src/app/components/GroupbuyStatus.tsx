'use client';

import { useEffect, useState } from 'react';
import type { Product } from '../lib/mockProducts';

function useNow(intervalMs: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // 서버 렌더와 시간이 달라 생기는 불일치를 피하려고 마운트 후에 현재 시각을 잡는다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function remainingLabel(endsAt: string, now: number) {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return '공구 마감';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `마감까지 ${days}일 ${hours}시간`;
  return `마감까지 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 상품 카드용 작은 배지 */
export function GroupbuyBadge({ product }: { product: Pick<Product, 'groupbuyEndsAt'> }) {
  const now = useNow(60000);
  if (!product.groupbuyEndsAt || now === null) return null;
  const closed = new Date(product.groupbuyEndsAt).getTime() <= now;
  const diff = new Date(product.groupbuyEndsAt).getTime() - now;
  const days = Math.ceil(diff / 86400000);
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        background: closed ? '#ece8e4' : days <= 1 ? '#ffe3e3' : '#fff1d6',
        color: closed ? '#8a837c' : days <= 1 ? '#c92a2a' : '#8a5a00',
      }}
    >
      {closed ? '마감' : days <= 1 ? '오늘 마감' : `D-${days}`}
    </span>
  );
}

/** 상품 상세용 공구 진행 패널 */
export function GroupbuyPanel({ product, ordered }: { product: Product; ordered: number }) {
  const now = useNow(1000);
  if (!product.groupbuyEndsAt && !ordered) return null;
  const closed = product.groupbuyEndsAt && now !== null ? new Date(product.groupbuyEndsAt).getTime() <= now : false;
  const target = product.groupbuyTarget ?? 0;
  const percent = target > 0 ? Math.min(100, Math.round((ordered / target) * 100)) : 0;
  const endText = product.groupbuyEndsAt
    ? new Date(product.groupbuyEndsAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: '14px 16px',
        borderRadius: 14,
        background: closed ? '#f3f1ef' : '#fff6e5',
        border: `1px solid ${closed ? '#e3dfdb' : '#f4d9a6'}`,
        margin: '4px 0 6px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong style={{ fontSize: 15, color: closed ? '#6f6861' : '#8a4b00', fontVariantNumeric: 'tabular-nums' }}>
          {product.groupbuyEndsAt ? (now === null ? '공구 진행중' : remainingLabel(product.groupbuyEndsAt, now)) : '공구 진행중'}
        </strong>
        {ordered > 0 && <span style={{ fontSize: 13, color: '#6f6861' }}>현재 {ordered.toLocaleString()}개 주문</span>}
      </div>
      {target > 0 && (
        <div aria-label={`목표 ${target}개 중 ${ordered}개`}>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, height: '100%', background: closed ? '#9d958e' : '#e8590c' }} />
          </div>
          <div style={{ fontSize: 12, color: '#6f6861', marginTop: 4 }}>목표 {target.toLocaleString()}개 · {percent}% 달성</div>
        </div>
      )}
      {endText && (
        <span style={{ fontSize: 12, color: '#6f6861' }}>
          {closed ? `${endText}에 마감된 공구입니다.` : `${endText} 마감 · 마감 후 일괄 주문해 순차 발송`}
        </span>
      )}
    </div>
  );
}
