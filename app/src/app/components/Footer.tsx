'use client';

import Link from 'next/link';
import { useMockStore } from '../lib/mockStore';
import styles from './Footer.module.css';

export function Footer() {
  const { settings } = useMockStore();

  // 전자상거래법상 사이버몰 표시 사항. 값이 들어온 항목만 보여준다.
  const facts: Array<[string, string]> = [
    ['상호', settings.companyName],
    ['대표자', settings.representative],
    ['사업자등록번호', settings.businessNumber],
    ['통신판매업 신고번호', settings.mailOrderNumber],
    ['사업장 주소', settings.address],
    ['개인정보 보호책임자', settings.privacyOfficer],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()));

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.section}>
            <h3 className={styles.title}>NiNi Land</h3>
            <p className={styles.subtitle}>아동복 공동구매</p>
          </div>

          {facts.map(([label, value]) => (
            <div key={label} className={styles.section}>
              <h4 className={styles.label}>{label}</h4>
              <p>{value}</p>
            </div>
          ))}

          {(settings.contactPhone || settings.contactEmail || settings.kakaoId) && (
            <div className={styles.section}>
              <h4 className={styles.label}>고객센터</h4>
              {settings.contactPhone && <p className={styles.contact}>{settings.contactPhone}</p>}
              {settings.contactEmail && <p className={styles.contact}>{settings.contactEmail}</p>}
              {settings.kakaoId && <p className={styles.contact}>카카오톡 {settings.kakaoId}</p>}
            </div>
          )}

          {settings.bankAccount && (
            <div className={styles.section}>
              <h4 className={styles.label}>입금 계좌</h4>
              <p>{settings.bankName} {settings.bankAccount}</p>
              <p>예금주 {settings.bankHolder}</p>
            </div>
          )}
        </div>

        <div className={styles.links}>
          <Link href="/notices">공지사항</Link>
          <span className={styles.divider}>|</span>
          <Link href="/orders/lookup">주문조회</Link>
          <span className={styles.divider}>|</span>
          <Link href="/terms">이용약관</Link>
          <span className={styles.divider}>|</span>
          <Link href="/privacy"><b>개인정보처리방침</b></Link>
          <span className={styles.divider}>|</span>
          <Link href="/support">고객지원</Link>
          <span className={styles.divider}>|</span>
          <Link href="/auth/login">관리자</Link>
        </div>

        <div className={styles.copyright}>
          <p>호스팅 서비스 제공자: Vercel Inc.</p>
          <p>&copy; {new Date().getFullYear()} NiNi Land. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
