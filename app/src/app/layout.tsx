import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "./components/Footer";
import { StoreHeader } from "./components/StoreHeader";
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
  title: "NiNi Land Mock Store",
  description: "Mock storefront for consumer and wholesale flows",
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
        </MockStoreProvider>
      </body>
    </html>
  );
}
