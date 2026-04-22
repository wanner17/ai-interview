import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "인패스 - AI 면접 시뮬레이터",
  description: "AI 기반 실전 면접 시뮬레이터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: 'linear-gradient(160deg, #ffffff 0%, #f5f3ff 50%, #ede9fe 100%)' }}>
        {/* 배경 글로우 */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '80%',
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.18) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', top: '-10%', right: '-15%', width: '60%', height: '70%',
            background: 'radial-gradient(ellipse, rgba(129,140,248,0.12) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        </div>
        <div className="relative flex flex-col min-h-full" style={{ zIndex: 1 }}>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
