'use client';

import Link from 'next/link';
import { useMockStore } from '../lib/mockStore';
import styles from './terms.module.css';

export default function TermsPage() {
  const { settings } = useMockStore();
  const company = settings.companyName || '니니랜드';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.back}>← 돌아가기</Link>
          <h1>이용약관</h1>
        </div>

        <div className={styles.content}>
          <section>
            <h2>제1조 목적</h2>
            <p>
              이 약관은 {company}(이하 &quot;판매자&quot;)가 운영하는 니니랜드 쇼핑몰(이하 &quot;몰&quot;)에서
              제공하는 공동구매(이하 &quot;공구&quot;) 상품 판매와 관련해 판매자와 이용자의 권리·의무를 정합니다.
            </p>
          </section>

          <section>
            <h2>제2조 공구 방식</h2>
            <ul>
              <li>몰의 상품은 정해진 공구 기간 동안 주문을 받은 뒤, 마감 후 판매자가 공급처(도매처)에 일괄 주문해 입고되는 대로 발송합니다.</li>
              <li>상품별 공구 마감 일시와 출고 안내는 상품 상세 화면에 표시합니다.</li>
              <li>공급처 사정으로 일부 옵션이 품절되거나 입고가 늦어질 수 있으며, 이 경우 주문 시 입력한 연락처로 안내하고 원하시면 해당 금액을 환불합니다.</li>
            </ul>
          </section>

          <section>
            <h2>제3조 주문과 계약 성립</h2>
            <ul>
              <li>이용자는 회원가입 없이 받는 분 정보와 입금자명을 입력해 주문할 수 있습니다.</li>
              <li>결제는 무통장 입금으로 하며, 판매자가 입금을 확인한 때 계약이 성립합니다.</li>
              <li>{settings.depositDeadlineHours > 0 ? `주문 후 ${settings.depositDeadlineHours}시간 안에 입금이 확인되지 않거나 ` : ''}공구가 마감될 때까지 입금되지 않은 주문은 취소될 수 있습니다.</li>
              <li>주문 금액·배송비는 주문 시점의 판매 가격으로 계산되며, 주문 완료 화면과 주문 조회 화면에 표시된 금액이 기준입니다.</li>
            </ul>
          </section>

          <section>
            <h2>제4조 배송</h2>
            <ul>
              <li>기본 배송비는 {settings.shippingFee.toLocaleString()}원이며{settings.freeShippingThreshold > 0 ? `, ${settings.freeShippingThreshold.toLocaleString()}원 이상 주문 시 무료입니다` : ''}.</li>
              <li>공구 상품은 마감 후 입고까지 기간이 걸려, 상품 상세의 출고 안내에 따라 발송됩니다.</li>
              <li>발송 후 택배사와 송장번호는 주문 조회 화면에서 확인할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2>제5조 주문 취소 · 청약철회</h2>
            <ul>
              <li>입금 전에는 주문 조회 화면에서 바로 취소할 수 있습니다.</li>
              <li>입금 후 발송 전에는 취소를 요청할 수 있으며, 확인 후 입금하신 계좌로 환불합니다.</li>
              <li>상품을 받은 날부터 7일 이내에 교환·반품(청약철회)을 신청할 수 있습니다. 단순 변심에 따른 반품 배송비는 이용자가 부담합니다.</li>
              <li>상품이 표시·광고 내용과 다르거나 불량·오배송인 경우, 받은 날부터 3개월 이내(그 사실을 안 날부터 30일 이내) 교환·반품할 수 있으며 배송비는 판매자가 부담합니다.</li>
              <li>이용자의 책임으로 상품이 훼손되거나, 착용·세탁 등으로 상품 가치가 크게 떨어진 경우에는 교환·반품이 제한될 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2>제6조 환불</h2>
            <p>
              환불은 반품 상품이 도착해 확인된 날 또는 취소가 확정된 날부터 3영업일 이내에 이용자가 알려준 계좌로 입금합니다.
            </p>
          </section>

          <section>
            <h2>제7조 분쟁 해결</h2>
            <p>
              판매자는 이용자의 불만과 피해 보상 요청을 고객센터{settings.contactPhone ? `(${settings.contactPhone})` : ''}에서 접수해 처리합니다.
              해결되지 않는 분쟁은 한국소비자원 또는 전자거래분쟁조정위원회에 조정을 신청할 수 있으며,
              소송은 민사소송법에 따른 관할 법원에 제기합니다.
            </p>
          </section>

          <section>
            <h2>판매자 정보</h2>
            <p>
              상호 {settings.companyName || '-'} · 대표자 {settings.representative || '-'} · 사업자등록번호 {settings.businessNumber || '-'}
              <br />
              통신판매업 신고 {settings.mailOrderNumber || '-'} · 주소 {settings.address || '-'}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
