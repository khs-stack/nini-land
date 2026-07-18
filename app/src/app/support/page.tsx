'use client';

import Link from 'next/link';
import { useState } from 'react';
import { initialSettings } from '../lib/mockSettings';
import styles from './support.module.css';

export default function SupportPage() {
  const [selectedType, setSelectedType] = useState('일반문의');
  const settings = initialSettings;

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
          <div className={styles.contactItem}>
            <h3>💬 카카오톡</h3>
            <a href={settings.openChatUrl} target="_blank" rel="noopener noreferrer">
              오픈채팅 바로가기
            </a>
          </div>
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
                  <li><strong>배송지 변경</strong>: 결제 전 변경 가능 (결제 후 불가)</li>
                  <li><strong>배송 기간</strong>: 일반적으로 주문 후 2-3일 이내 배송</li>
                  <li><strong>배송비</strong>: 3,000원 (일정 금액 이상 무료)</li>
                  <li><a href="/shipping">배송 조회</a>에서 실시간 추적 가능</li>
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
                  <li>상품 상세 페이지에서 Q&A 남길 수 있습니다.</li>
                </ul>
              </div>
            )}
            {selectedType === '취소/교환/반품' && (
              <div>
                <h3>취소/교환/반품</h3>
                <ul>
                  <li><strong>취소</strong>: 결제 후 배송 전 가능 (배송 시작 시 불가)</li>
                  <li><strong>교환/반품</strong>: 상품 수령 후 7일 이내 신청</li>
                  <li><strong>환불</strong>: 반품 처리 후 3-5일 이내 처리</li>
                  <li>마이페이지에서 신청 현황을 확인하실 수 있습니다.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.faqSection}>
          <h2>자주 묻는 질문</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4>Q. 도매가는 어떻게 확인하나요?</h4>
              <p>A. 사업자회원 승인 후 상품 상세 페이지에서 도매가가 표시됩니다.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Q. 최소 주문수량이 있나요?</h4>
              <p>A. 도매회원은 상품별 최소주문수량을 확인 후 구매하셔야 합니다.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Q. 공구는 언제 진행되나요?</h4>
              <p>A. <Link href="/groupbuy">공구 일정</Link>을 참고하세요. 주기적으로 공구가 진행됩니다.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Q. 사업자회원은 어떻게 가입하나요?</h4>
              <p>A. <Link href="/auth/signup-wholesale">사업자회원 가입</Link> 페이지에서 신청 후 승인을 기다리시면 됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
