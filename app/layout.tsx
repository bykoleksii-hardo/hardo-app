import type { Metadata, Viewport } from 'next';
import CommandPalette from '@/app/_components/CommandPalette';
import { getUserRole } from '@/lib/auth/roles';
import { Inter_Tight, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hardo-app.bykoleksii.workers.dev'),
  title: 'HARDO \u2014 AI mock interviews for IB',
  description: 'Practice against the bar. Twelve questions per session, voice or text, a real scorecard at the end.',
  applicationName: 'HARDO',
  openGraph: {
    type: 'website',
    title: 'HARDO \u2014 AI mock interviews for IB',
    description: 'Practice against the bar. Twelve questions per session, voice or text, a real scorecard at the end.',
    images: ['/og.png'],
    siteName: 'HARDO',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary',
    title: 'HARDO \u2014 AI mock interviews for IB',
    description: 'Practice against the bar. Twelve questions per session, voice or text, a real scorecard at the end.',
  },
  robots: { index: true, follow: true },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#FBF7EE',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();
  const isAdmin = role === 'admin' || role === 'editor';
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans bg-paper text-ink antialiased">
        {children}
        <CommandPalette isAdmin={isAdmin} />
      </body>
    </html>
  );
}
