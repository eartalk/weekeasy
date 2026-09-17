import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeekEasy — 多一种理解自己的方式',
  description: '结合传统结构、现代人格测评与真实反馈的自我理解工具。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
