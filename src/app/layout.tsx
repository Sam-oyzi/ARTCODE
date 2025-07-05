import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import { ConditionalAppShell } from '@/components/conditional-app-shell';

export const metadata: Metadata = {
  title: 'Art Code - 3D Models Platform',
  description: 'Upload, view, and share 3D models with AR technology. Create QR codes for interactive AR experiences.',
  keywords: ['3D models', 'AR', 'augmented reality', 'QR codes', 'art', 'design'],
  authors: [{ name: 'Sam-oyzi' }],
  creator: 'Sam-oyzi',
  publisher: 'Art Code',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js" async></script>
      </head>
      <body className="font-body antialiased">
        <Providers>
          <ConditionalAppShell>{children}</ConditionalAppShell>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
