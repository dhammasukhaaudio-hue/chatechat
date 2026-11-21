import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChateChat (ချိတ်ချက်) - Multi-Channel Agent Workspace',
  description: 'High-performance real-time unified inbox for Myanmar businesses (Messenger, Viber, Telegram, TikTok)',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="my">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body className="antialiased h-screen overflow-hidden bg-slate-100">{children}</body>
    </html>
  );
}
