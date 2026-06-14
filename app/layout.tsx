import type { Metadata, Viewport } from 'next';
import CommandPalette from '@/app/_components/CommandPalette';
import { getUserRole } from '@/lib/auth/roles';
import { SITE_URL } from '@/lib/seo';
import { Inter_Tight, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'HARDO \u2014 AI Mock Interviews for Investment Banking',
  description: 'AI mock interview simulation for investment banking. Accounting, valuation, M&A, behavioral — all graded with a real scorecard.',
  applicationName: 'HARDO',
  openGraph: {
    type: 'website',
    title: 'HARDO \u2014 AI Mock Interviews for Investment Banking',
    description: 'AI mock interview simulation for investment banking. Accounting, valuation, M&A, behavioral — all graded with a real scorecard.',
    images: ['/og.png'],
    siteName: 'HARDO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HARDO \u2014 AI Mock Interviews for Investment Banking',
    description: 'AI mock interview simulation for investment banking. Accounting, valuation, M&A, behavioral — all graded with a real scorecard.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  icons: { apple: '/apple-touch-icon.png' },
  verification: {
    google: 'Gzhj6xgZn_O37vvV09ekTAUrCPDtUoju443ffYOwsbM',
  },
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
