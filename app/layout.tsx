import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '噜妹',
  description: '宝宝成长记录台（喂奶/换尿布/睡眠/体温/喂药/医疗/体重/消费）',
  manifest: '/manifest.webmanifest',
  applicationName: '水豚噜噜',
  appleWebApp: {
    capable: true,
    title: '水豚噜噜',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/logo.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07c160',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
