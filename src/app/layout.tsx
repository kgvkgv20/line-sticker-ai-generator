import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LINE Sticker AI Generator | LIFF App',
  description: 'Generate complete, consistent LINE sticker packs ready for LINE Creators Market submission using Google AI Studio (Gemini & Imagen).',
  keywords: ['LINE Sticker', 'LIFF', 'Google AI Studio', 'Gemini', 'Imagen 3', 'LINE Creators Market'],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F9FA] text-gray-900 selection:bg-line/20 selection:text-line-dark">
        {children}
      </body>
    </html>
  );
}
