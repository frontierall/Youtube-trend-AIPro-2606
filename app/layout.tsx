import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YouTube 트렌드 분석',
  description: '최신 유튜브 급상승 동영상을 국가별·카테고리별로 분석하는 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>{children}</body>
    </html>
  );
}
