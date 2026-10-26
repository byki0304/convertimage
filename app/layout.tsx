import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BackgroundFx } from '@/components/ui/BackgroundFx';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'convertimage — Lossless Game Asset Converter',
  description: 'Convert JPG, PNG, WebP, AVIF, GIF and BMP game assets without quality loss, up to 20 files at once.',
  manifest: '/manifest.json',
  applicationName: 'convertimage',
  icons: {
    icon: [
      { url: '/assets/brand/icons/desktop/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/brand/icons/desktop/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/brand/icons/desktop/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/assets/brand/icons/desktop/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/assets/brand/icons/desktop/icon-32.png',
    apple: [{ url: '/assets/brand/icons/mobile/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'convertimage',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'msapplication-TileColor': '#0B0C10',
    'msapplication-TileImage': '/assets/brand/icons/desktop/icon-256.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0C10',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <BackgroundFx />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
