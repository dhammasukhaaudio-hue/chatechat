import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChateChat (ချိတ်ချက်) - Multi-Channel Agent Workspace',
  description: 'High-performance real-time unified inbox for Myanmar businesses (Messenger, Viber, Telegram, TikTok)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="my">
      <body className="antialiased h-screen overflow-hidden bg-slate-100">{children}</body>
    </html>
  );
}
