'use client';

import Link from 'next/link';
import styles from './terms.module.css';

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.back}>← 돌아가기</Link>
          <h1>이용약관</h1>
        </div>

        <div className={styles.content}>
          <section>
            <h2>제 1조 총칙</h2>
            <p>
              본 이용약관은 니니랜드(이하 "회사")와 이용자 간의 전자상거래 관계에 
              적용되는 기본적인 권리와 의무를 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2>제 2조 용어의 정의</h2>
            <ul>
              <li>"회사"는 니니랜드를 운영하는 법인을 의미합니다.</li>
              <li>"회원"은 회사와 계약을 체결하고 서비스를 이용하는 개인 또는 법인입니다.</li>
              <li>"상품"은 회사가 제공하는 아동복입니다.</li>
              <li>"주문"은 회원이 상품 구매를 신청하는 행위입니다.</li>
            </ul>
          </section>

          <section>
            <h2>제 3조 계약의 성립</h2>
            <p>
              1. 회사의 상품 표시와 가격은 청약의 유인입니다.
              2. 회원이 상품을 주문하면 계약의 청약을 하는 것이며, 
              회사가 주문을 확인하면 계약이 성립합니다.
              3. 회사는 회원의 신용도, 재고 상황 등을 고려하여 
              주문을 승낙하거나 거절할 수 있습니다.
            </p>
          </section>

          <section>
            <h2>제 4조 상품 정보 및 가격</h2>
            <p>
              1. 상품의 가격은 소비자가와 도매가로 구분되며, 
              회원의 자격에 따라 상이합니다.
              2. 도매회원의 자격 여부는 회사의 승인 절차를 거칩니다.
              3. 가격은 예고 없이 변경될 수 있습니다.
            </p>
          </section>

          <section>
            <h2>제 5조 배송 및 배송료</h2>
            <p>
              1. 상품은 주문 확인 후 일반적으로 2-3일 이내에 배송됩니다.
              2. 배송료는 주문 시점의 기준으로 계산됩니다.
              3. 특정 금액 이상 구매 시 배송료가 면제될 수 있습니다.
            </p>
          </section>

          <section>
            <h2>제 6조 반품 및 교환</h2>
            <p>
              1. 반품 및 교환은 상품 수령 후 7일 이내에 신청해야 합니다.
              2. 상품이 훼손된 경우 반품이 불가능할 수 있습니다.
              3. 회사의 사유로 인한 오배송이나 불량품은 
              반품 및 교환 기한이 연장됩니다.
            </p>
          </section>

          <section>
            <h2>제 7조 환불</h2>
            <p>
              1. 환불은 반품 완료 후 3-5일 이내에 처리됩니다.
              2. 환불 수수료는 회원이 부담합니다.
              3. 반품 상품에 대한 검수 후 환불 처리됩니다.
            </p>
          </section>

          <section>
            <h2>제 8조 책임의 제한</h2>
            <p>
              회사는 천재지변, 전쟁, 테러 등으로 인한 서비스 중단에 
              대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2>제 9조 준거법 및 관할</h2>
            <p>본 약관은 대한민국 법률에 따라 해석되며, 
            서울중앙지방법원을 관할 법원으로 합니다.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
