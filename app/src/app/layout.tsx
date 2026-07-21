import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "./components/Footer";
import { StoreHeader } from "./components/StoreHeader";
import { BottomTabBar } from "./components/BottomTabBar";
import { ScrollTopButton } from "./components/ScrollTopButton";
import { MockStoreProvider } from "./lib/mockStore";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "니니랜드 | NiNi Land - 아동복 도소매 전문몰",
  description: "니니랜드는 직접 디자인·생산한 아동복을 일반 소비자와 도매 사업자에게 판매하는 도·소매 통합 쇼핑몰입니다.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "니니랜드 | NiNi Land",
    description: "아동복 도소매 전문몰, 니니랜드에서 만나보세요.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
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
