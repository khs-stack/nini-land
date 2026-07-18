import Link from 'next/link';
import { initialSettings } from '../lib/mockSettings';
import styles from './Footer.module.css';

export function Footer() {
  const settings = initialSettings;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.section}>
            <h3 className={styles.title}>NiNi Land</h3>
            <p className={styles.subtitle}>아동복 도·소매 통합 쇼핑몰</p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.label}>상호명</h4>
            <p>{settings.companyName}</p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.label}>사업자등록번호</h4>
            <p>{settings.businessNumber}</p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.label}>대표자</h4>
            <p>{settings.representative}</p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.label}>주소</h4>
            <p>{settings.address}</p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.label}>고객센터</h4>
            <p className={styles.contact}>{settings.contactPhone}</p>
            <p className={styles.contact}>{settings.contactEmail}</p>
          </div>
        </div>

        <div className={styles.links}>
          <Link href="/terms">이용약관</Link>
          <span className={styles.divider}>|</span>
          <Link href="/privacy">개인정보처리방침</Link>
          <span className={styles.divider}>|</span>
          <Link href="/support">고객지원</Link>
        </div>

        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} NiNi Land. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
