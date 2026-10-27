'use client';

import Link from 'next/link';
import { useMockStore } from '../lib/mockStore';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const { settings } = useMockStore();
  const company = settings.companyName || '니니랜드';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.back}>← 돌아가기</Link>
          <h1>개인정보처리방침</h1>
        </div>

        <div className={styles.content}>
          <section>
            <p>{company}(이하 &quot;판매자&quot;)는 주문 처리에 꼭 필요한 정보만 받고, 아래 기준에 따라 처리합니다.</p>
          </section>

          <section>
            <h2>1. 수집하는 정보와 목적</h2>
            <ul>
              <li><b>주문 시</b>: 받는 분 이름, 연락처, 배송지 주소, 배송 메모, 입금자명 → 주문 확인, 입금 확인, 배송, 취소·환불 안내</li>
              <li><b>카카오 간편가입 시</b>: 카카오 계정 식별값, 닉네임(이름), 이메일(제공 동의 시) → 회원 식별, 주문 내역 보관</li>
              <li><b>사업자·입점 도매처 가입 시</b>: 이메일, 비밀번호(암호화 저장), 상호, 대표자, 사업자등록번호, 연락처, 사업장 주소, 사업자등록증 사본, 입점 도매처는 통신판매업 신고번호와 정산 계좌 → 사업자 확인, 도매 거래, 판매 대금 정산</li>
              <li><b>자동 생성</b>: 주문번호, 주문 일시, 주문 상품 내역</li>
              <li>카드번호 등 결제수단 정보는 수집하지 않습니다.</li>
              <li>장바구니·관심상품·최근 본 상품과 이 기기의 주문번호는 이용자 브라우저에만 저장되고 판매자에게 전송되지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2>2. 보유 기간</h2>
            <p>목적을 다 이룬 뒤 지체 없이 파기합니다. 다만 전자상거래법에 따라 아래 기간 동안 보관합니다.</p>
            <ul>
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년</li>
            </ul>
          </section>

          <section>
            <h2>3. 제3자 제공</h2>
            <p>
              상품 배송을 위해 택배사에 받는 분 이름·연락처·주소를 제공합니다. 입점 도매처가 직접 발송하는 상품은 입금 확인 후
              해당 도매처에 받는 분 이름·연락처·주소·배송 메모를 제공합니다(배송 목적, 배송 완료 후 거래 기록 보관 기간까지).
              그 밖에는 법령에 근거가 있거나 이용자가 동의한 경우에만 제공합니다.
            </p>
          </section>

          <section>
            <h2>4. 처리 위탁</h2>
            <ul>
              <li>Supabase Inc.: 주문 정보 저장(데이터베이스, 서울 리전)</li>
              <li>Vercel Inc.: 웹사이트 호스팅</li>
              <li>Kakao Corp.: 카카오 간편가입·로그인 (가입한 경우)</li>
            </ul>
          </section>

          <section>
            <h2>5. 파기 방법</h2>
            <p>보유 기간이 끝난 정보는 데이터베이스에서 복구할 수 없게 삭제하고, 출력물은 분쇄합니다.</p>
          </section>

          <section>
            <h2>6. 이용자의 권리</h2>
            <p>이용자는 언제든 본인 주문 정보의 열람·정정·삭제·처리정지를 요청할 수 있으며, 아래 연락처로 요청하면 지체 없이 처리합니다. (법정 보관 기간 중인 정보는 보관 후 파기)</p>
          </section>

          <section>
            <h2>7. 안전성 확보 조치</h2>
            <ul>
              <li>모든 통신은 암호화(HTTPS)되어 전송됩니다.</li>
              <li>주문 정보는 관리자 계정으로 로그인한 운영자만 볼 수 있도록 접근 권한을 제한합니다.</li>
              <li>손님의 주문 조회는 주문번호와 연락처가 모두 일치할 때만 가능합니다.</li>
            </ul>
          </section>

          <section>
            <h2>8. 개인정보 보호책임자</h2>
            <p>
              {settings.privacyOfficer || settings.representative || '-'}
              <br />
              연락처: {settings.contactPhone || '-'}{settings.contactEmail ? ` · ${settings.contactEmail}` : ''}
            </p>
            <p style={{ marginTop: 8 }}>
              개인정보 침해 신고·상담: 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972)
            </p>
          </section>

          <section>
            <h2>9. 변경</h2>
            <p>이 방침이 바뀌면 시행 7일 전부터 이 화면으로 알립니다.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
