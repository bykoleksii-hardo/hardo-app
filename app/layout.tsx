import type { Metadata } from 'next';
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
  title: 'HARDO \u2014 AI mock interviews for IB',
  description: 'Practice against the bar. Twelve questions per session, voice or text, a real scorecard at the end.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
