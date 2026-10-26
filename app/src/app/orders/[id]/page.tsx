'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useMockStore } from '../../lib/mockStore';
import {
  formatPhone,
  friendlyError,
  ORDER_STATUS_LABEL,
  supabase,
  trackingUrl,
  type GuestOrder,
} from '../../lib/supabase';
import styles from './OrderDetail.module.css';

const STEPS: Array<GuestOrder['status']> = ['awaiting_deposit', 'paid', 'preparing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useMockStore();
  const orderNo = decodeURIComponent(id);
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '');
  const [phoneInput, setPhoneInput] = useState('');
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'notfound' | 'ready'>(phone ? 'loading' : 'idle');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (targetPhone: string) => {
    if (!supabase || !targetPhone) return;
    setState('loading');
    const { data } = await supabase.rpc('get_order', { p_order_no: orderNo, p_phone: targetPhone });
    if (data) {
      setOrder(data as GuestOrder);
      setState('ready');
    } else {
      setOrder(null);
      setState('notfound');
    }
  }, [orderNo]);

  useEffect(() => {
    // 주문 정보는 주소의 연락처로 서버에서 조회한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phone) void load(phone);
  }, [phone, load]);

  const submitPhone = (event: FormEvent) => {
    event.preventDefault();
    if (!phoneInput.trim()) return;
    setPhone(phoneInput.trim());
    router.replace(`/orders/${encodeURIComponent(orderNo)}?phone=${encodeURIComponent(phoneInput.trim())}`);
  };

  const submitCancel = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !order) return;
    const { data, error } = await supabase.rpc('cancel_order', { p_order_no: order.orderNo, p_phone: phone, p_reason: reason.trim() || '고객 요청' });
    if (error) {
      setNotice(friendlyError(error, '취소를 처리하지 못했습니다. 고객센터로 문의해주세요.'));
      return;
    }
    setNotice(data === 'cancelled' ? '주문이 취소되었습니다.' : '취소 요청이 접수되었습니다. 입금하신 금액은 확인 후 환불해드립니다.');
    setCancelOpen(false);
    void load(phone);
  };

  if (state === 'idle' || state === 'notfound') {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>주문번호 {orderNo}</h1>
          <p style={{ color: '#666', fontSize: 14, margin: '8px 0 14px' }}>
            {state === 'notfound' ? '연락처가 일치하지 않거나 없는 주문입니다. 주문할 때 입력한 연락처를 다시 입력해주세요.' : '주문할 때 입력한 연락처를 입력하면 주문 내용을 볼 수 있습니다.'}
          </p>
          <form onSubmit={submitPhone} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label htmlFor="detail-phone" className="visually-hidden">연락처</label>
            <input id="detail-phone" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="010-1234-5678" inputMode="tel"
              style={{ flex: '1 1 180px', border: '1px solid #ddd', borderRadius: 12, padding: '11px 12px', fontSize: 16 }} />
            <button type="submit" className={styles.submitBtn}>확인</button>
          </form>
        </section>
      </main>
    );
  }

  if (state === 'loading' || !order) {
    return (
      <main className={styles.page}>
        <section className={styles.card}><p style={{ color: '#666' }}>주문 정보를 불러오는 중…</p></section>
      </main>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);
  const trackUrl = trackingUrl(order.courier, order.trackingNo);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.orderId}>주문번호 {order.orderNo}</div>
        <h1 className={styles.title}>{ORDER_STATUS_LABEL[order.status]}</h1>
        {order.status !== 'cancelled' && (
          <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4, listStyle: 'none', padding: 0, margin: '14px 0 4px' }}>
            {STEPS.map((step, index) => (
              <li key={step} style={{ textAlign: 'center', fontSize: 11, fontWeight: index === stepIndex ? 800 : 500, color: index <= stepIndex ? '#111' : '#aaa' }}>
                <div style={{ height: 4, borderRadius: 4, background: index <= stepIndex ? '#111' : '#e6e1dc', marginBottom: 6 }} />
                {ORDER_STATUS_LABEL[step]}
              </li>
            ))}
          </ol>
        )}
        {order.cancelRequestedAt && order.status !== 'cancelled' && (
          <p style={{ marginTop: 10, color: '#c93442', fontSize: 13, fontWeight: 700 }}>취소 요청이 접수되어 확인 중입니다.</p>
        )}
        {notice && <p style={{ marginTop: 10, color: '#2f6f4f', fontSize: 13, fontWeight: 700 }}>{notice}</p>}
      </section>

      {order.status === 'awaiting_deposit' && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>입금 안내</h2>
          <div className={styles.orderFacts}>
            <div><span>입금하실 금액</span><b>{order.total.toLocaleString()}원</b></div>
            <div><span>입금 계좌</span><b>{settings.bankName} {settings.bankAccount}</b></div>
            <div><span>예금주</span><b>{settings.bankHolder}</b></div>
            <div><span>입금자명</span><b>{order.depositorName}</b></div>
          </div>
        </section>
      )}

      {order.trackingNo && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>배송 조회</h2>
          <div className={styles.orderFacts}>
            <div><span>택배사</span><b>{order.courier}</b></div>
            <div><span>송장번호</span><b>{order.trackingNo}</b></div>
          </div>
          {trackUrl && (
            <a href={trackUrl} target="_blank" rel="noreferrer" className={styles.shippingLink} style={{ display: 'inline-block', marginTop: 10 }}>
              택배사에서 배송 조회 →
            </a>
          )}
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>주문 상품</h2>
        <div className={styles.itemList}>
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className={styles.item} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flex: '0 0 auto', background: '#f4f1ee' }}>
                <Image src={item.image || '/placeholder-product.svg'} alt={item.name} fill sizes="64px" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemMeta}>
                  {[item.color, item.size].filter(Boolean).join(' / ')} · {item.quantity}개 · {(item.unitPrice * item.quantity).toLocaleString()}원
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.orderFacts} style={{ marginTop: 12 }}>
          <div><span>상품금액</span><b>{order.subtotal.toLocaleString()}원</b></div>
          <div><span>배송비</span><b>{order.shippingFee === 0 ? '무료' : `${order.shippingFee.toLocaleString()}원`}</b></div>
        </div>
        <div className={styles.totalRow}><span>합계</span><b>{order.total.toLocaleString()}원</b></div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>배송지</h2>
        <div className={styles.orderFacts}>
          <div><span>받는 분</span><b>{order.recipient}</b></div>
          <div><span>연락처</span><b>{formatPhone(order.phone)}</b></div>
          <div><span>주소</span><b>{order.address}</b></div>
          {order.memo && <div><span>메모</span><b>{order.memo}</b></div>}
          <div><span>주문일시</span><b>{new Date(order.createdAt).toLocaleString('ko-KR')}</b></div>
        </div>
      </section>

      {(order.status === 'awaiting_deposit' || ((order.status === 'paid' || order.status === 'preparing') && !order.cancelRequestedAt)) && (
        <section className={styles.card}>
          {!cancelOpen ? (
            <button type="button" className={styles.cancelBtn} onClick={() => setCancelOpen(true)}>
              {order.status === 'awaiting_deposit' ? '주문 취소하기' : '취소 요청하기'}
            </button>
          ) : (
            <form onSubmit={submitCancel} className={styles.form}>
              <div className={styles.formTitle}>{order.status === 'awaiting_deposit' ? '입금 전이라 바로 취소됩니다.' : '입금 확인 후라 취소 요청으로 접수되고, 확인 후 환불해드립니다.'}</div>
              <label htmlFor="cancel-reason" className="visually-hidden">취소 사유</label>
              <textarea id="cancel-reason" className={styles.textarea} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="취소 사유 (선택)" maxLength={500} />
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setCancelOpen(false)}>닫기</button>
                <button type="submit" className={styles.submitBtn}>{order.status === 'awaiting_deposit' ? '취소 확정' : '요청 보내기'}</button>
              </div>
            </form>
          )}
          <p style={{ marginTop: 10, color: '#888', fontSize: 12 }}>
            교환·반품은 상품을 받은 뒤 7일 이내에 고객센터{settings.contactPhone ? `(${settings.contactPhone})` : ''}로 문의해주세요.
          </p>
        </section>
      )}

      <Link href="/orders" className={styles.shippingLink}>← 주문 내역</Link>
    </main>
  );
}
