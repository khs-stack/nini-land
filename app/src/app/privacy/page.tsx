'use client';

import Link from 'next/link';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.back}>← 돌아가기</Link>
          <h1>개인정보처리방침</h1>
        </div>

        <div className={styles.content}>
          <section>
            <h2>1. 개인정보 수집</h2>
            <p>
              니니랜드는 다음과 같은 개인정보를 수집합니다:
            </p>
            <ul>
              <li>이메일, 연락처, 이름</li>
              <li>배송 주소</li>
              <li>결제 정보</li>
              <li>쇼핑 이력 및 관심상품</li>
              <li>비회원 주문 조회를 위한 주문번호 및 연락처</li>
            </ul>
          </section>

          <section>
            <h2>2. 개인정보의 이용</h2>
            <p>수집된 개인정보는 다음 목적으로 이용됩니다:</p>
            <ul>
              <li>회원가입 및 인증</li>
              <li>주문 처리 및 배송</li>
              <li>결제 처리</li>
              <li>고객 서비스</li>
              <li>마케팅 및 신상품 안내 (동의 시)</li>
              <li>사업자 회원 자격 심사</li>
            </ul>
          </section>

          <section>
            <h2>3. 개인정보의 보호</h2>
            <p>
              니니랜드는 개인정보를 안전하게 보호하기 위해 
              다음과 같은 조치를 취합니다:
            </p>
            <ul>
              <li>암호화된 연결을 통한 정보 전송</li>
              <li>접근 제어 및 권한 관리</li>
              <li>정기적인 보안 감사</li>
              <li>직원 보안 교육</li>
            </ul>
          </section>

          <section>
            <h2>4. 개인정보의 공개 및 제3자 제공</h2>
            <p>
              니니랜드는 별도 동의 없이 개인정보를 제3자에게 
              공개하지 않습니다. 다만 다음의 경우는 예외입니다:
            </p>
            <ul>
              <li>배송 업체로의 주소 정보 제공</li>
              <li>법률적 의무가 있는 경우</li>
              <li>사용자의 명시적 동의가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2>5. 개인정보의 보유 및 삭제</h2>
            <p>
              개인정보는 회원 탈퇴 또는 서비스 종료 시 
              지체 없이 삭제됩니다. 단, 법률에 따라 
              보관해야 하는 정보는 해당 기간 동안 보관됩니다.
            </p>
          </section>

          <section>
            <h2>6. 사용자의 권리</h2>
            <p>사용자는 다음과 같은 권리가 있습니다:</p>
            <ul>
              <li>개인정보 열람 및 수정</li>
              <li>개인정보 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>마케팅 수신 거부</li>
            </ul>
          </section>

          <section>
            <h2>7. 쿠키 및 추적 기술</h2>
            <p>
              니니랜드는 사용자 경험을 개선하기 위해 
              쿠키 및 로컬 스토리지를 사용합니다.
            </p>
          </section>

          <section>
            <h2>8. 정책 변경</h2>
            <p>
              본 개인정보처리방침은 관련 법률의 변경 등으로 
              인해 변경될 수 있습니다. 변경 시 공지합니다.
            </p>
          </section>

          <section>
            <h2>9. 문의</h2>
            <p>
              개인정보에 대한 문의는 고객센터로 연락 주시기 바랍니다.
              <br />
              이메일: support@nini-land.example
              <br />
              전화: 02-1234-5678
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
