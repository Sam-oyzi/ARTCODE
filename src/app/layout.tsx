import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import { ConditionalAppShell } from '@/components/conditional-app-shell';

export const metadata: Metadata = {
  title: 'ART CODE',
  description: 'Create AR experiences for your business.',
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
