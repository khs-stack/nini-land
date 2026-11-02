import type { Metadata } from 'next';
import { Footer } from './components/Footer';
import { StoreHeader } from './components/StoreHeader';
import { BottomTabBar } from './components/BottomTabBar';
import { ScrollTopButton } from './components/ScrollTopButton';
import { MockStoreProvider } from './lib/mockStore';
import './globals.css';

export const metadata: Metadata = {
  title: '니니랜드 | NiNi Land - 오리지널 변신로봇',
  description: '니니랜드가 직접 만든 변신로봇. 상시 판매와 한정 예약, 가게 사장님을 위한 사업자 도매까지.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '니니랜드 | NiNi Land',
    description: '니니랜드 오리지널 변신로봇을 만나보세요.',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <MockStoreProvider>
          <StoreHeader />
          {children}
          <Footer />
          <BottomTabBar />
          <ScrollTopButton />
        </MockStoreProvider>
      </body>
    </html>
  );
}
