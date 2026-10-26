'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMockStore } from '../lib/mockStore';
import styles from './support.module.css';

export default function SupportPage() {
  const [selectedType, setSelectedType] = useState('일반문의');
  const { settings } = useMockStore();

  const supportCategories = ['일반문의', '배송문의', '상품문의', '취소/교환/반품'];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>고객센터</h1>
          <p>문제 해결이나 문의가 있으신가요? 저희가 도와드리겠습니다.</p>
        </div>

        <div className={styles.contactInfo}>
          <div className={styles.contactItem}>
            <h3>📞 전화</h3>
            <p>{settings.contactPhone}</p>
          </div>
          <div className={styles.contactItem}>
            <h3>📧 이메일</h3>
            <p>{settings.contactEmail}</p>
          </div>
          {(settings.openChatUrl || settings.kakaoId) && (
            <div className={styles.contactItem}>
              <h3>💬 카카오톡</h3>
              {settings.openChatUrl ? (
                <a href={settings.openChatUrl} target="_blank" rel="noopener noreferrer">오픈채팅 바로가기</a>
              ) : (
                <p>{settings.kakaoId}</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>문의 유형별 안내</h2>
          <div className={styles.categoryButtons}>
            {supportCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.categoryButton} ${selectedType === category ? styles.active : ''}`}
                onClick={() => setSelectedType(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className={styles.guidebox}>
            {selectedType === '일반문의' && (
              <div>
                <h3>일반문의</h3>
                <ul>
                  <li>회사 정보 관련 문의</li>
                  <li>협력 및 제휴 제안</li>
                  <li>기타 일반 문의</li>
                </ul>
              </div>
            )}
            {selectedType === '배송문의' && (
              <div>
                <h3>배송문의</h3>
                <ul>
                  <li><strong>배송지 변경</strong>: 발송 전까지 고객센터로 요청</li>
                  <li><strong>배송 기간</strong>: 공구 마감 후 도매처 입고 → 검수 → 순차 발송</li>
                  <li><strong>배송비</strong>: {settings.shippingFee.toLocaleString()}원{settings.freeShippingThreshold > 0 ? ` (${settings.freeShippingThreshold.toLocaleString()}원 이상 무료)` : ''}</li>
                  <li><Link href="/orders/lookup">주문 조회</Link>에서 송장번호와 배송 상태 확인</li>
                </ul>
              </div>
            )}
            {selectedType === '상품문의' && (
              <div>
                <h3>상품문의</h3>
                <ul>
                  <li>상품 스펙 및 사이즈 문의</li>
                  <li>재고 확인</li>
                  <li>컬러/옵션 관련 문의</li>
                  <li>카카오톡 또는 전화로 문의해주세요.</li>
                </ul>
              </div>
            )}
            {selectedType === '취소/교환/반품' && (
              <div>
                <h3>취소/교환/반품</h3>
                <ul>
                  <li><strong>취소</strong>: 입금 전 즉시 취소, 입금 후 발송 전에는 취소 요청</li>
                  <li><strong>교환/반품</strong>: 상품 수령 후 7일 이내 신청</li>
                  <li><strong>환불</strong>: 반품 처리 후 3-5일 이내 처리</li>
                  <li>주문 조회 화면에서 진행 상태를 확인하실 수 있습니다.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.faqSection}>
          <h2>자주 묻는 질문</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4>Q. 공구는 어떻게 진행되나요?</h4>
              <p>A. 상품별 마감일까지 주문·입금을 받고, 마감 후 도매처에 한 번에 주문해 입고되는 대로 순차 발송합니다. <Link href="/groupbuy">진행중인 공구 보기</Link></p>
            </div>
            <div className={styles.faqItem}>
              <h4>Q. 회원가입을 해야 하나요?</h4>
              <p>A. 아니요. 회원가입 없이 주문하고, 주문번호와 연락처로 <Link href="/orders/lookup">주문 조회</Link>를 할 수 있습니다.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Q. 결제는 어떻게 하나요?</h4>
              <p>A. 무통장 입금입니다. 주문 완료 화면에 입금 계좌가 안내되며, 입금 확인 후 주문이 확정됩니다.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Q. 주문을 취소하고 싶어요.</h4>
              <p>A. 입금 전에는 주문 조회 화면에서 바로 취소됩니다. 입금 후에는 취소 요청을 남겨주시면 확인 후 환불해드립니다.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
