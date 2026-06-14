import Link from 'next/link';
import type { Metadata } from 'next';
import LandingFooter from '@/app/(landing)/_components/Footer';
import HeaderAuth from '@/app/_components/HeaderAuth';
import JsonLd from '@/app/_components/JsonLd';
import { ROUNDUP_TOOLS, COMPARISONS, COMPARE_REVIEWED } from '@/lib/compare';
import { abs, breadcrumbLd } from '@/lib/seo';

const PATH = '/best-ai-investment-banking-mock-interview-tools';
const TITLE = 'Best AI Investment Banking Mock Interview Tools (2026) — HARDO';
const DESC =
  'A practical roundup of the best AI investment banking mock interview tools in 2026 — HARDO, Cook’d AI, Superday AI, IB Mock and more — with what each is best for and how to choose.';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PATH },
  openGraph: { type: 'article', title: TITLE, description: DESC, url: PATH, images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.png'] },
};

export default function Page() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best AI Investment Banking Mock Interview Tools',
    itemListElement: ROUNDUP_TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: t.internal ? abs(t.url) : t.url,
    })),
  };

  return (
    <>
      <HeaderAuth onLanding />
      <main>
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
            <div className="kicker mb-3">Roundup</div>
            <h1 className="font-serif text-[40px] md:text-[56px] font-light leading-[1.05] tracking-[-0.022em]">
              Best AI Investment Banking Mock Interview Tools
            </h1>
            <p className="mt-5 text-[17px] text-ink-2 leading-relaxed">
              A growing set of AI tools now run investment banking mock interviews — voice or text, graded, available
              the night before a superday. Here’s an honest look at the main options in {COMPARE_REVIEWED.split(' ')[1] || '2026'},
              what each is best for, and how to choose. (Full disclosure: this roundup is published by HARDO, one of
              the tools below — so we list it first and tell you plainly where the others fit better.)
            </p>
          </div>
        </section>

        {/* The tools */}
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <ol className="space-y-8">
              {ROUNDUP_TOOLS.map((t, i) => (
                <li key={t.name} className="border-t border-line pt-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[12px] text-gold-2">{String(i + 1).padStart(2, '0')}</span>
                    <h2 className="font-serif text-[24px] font-medium">
                      {t.internal ? (
                        <Link href={t.url} className="hover:text-gold transition-colors">{t.name}</Link>
                      ) : (
                        <a href={t.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-gold transition-colors">{t.name}</a>
                      )}
                    </h2>
                  </div>
                  <p className="mt-3 text-[15.5px] text-ink-2 leading-relaxed">{t.line}</p>
                  {t.internal && (
                    <Link href="/login" className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] text-ink hover:text-gold transition-colors">
                      Try one free interview <span aria-hidden>→</span>
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How to choose */}
        <section className="border-b border-line bg-cream/40">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <h2 className="font-serif text-[28px] md:text-[34px] font-light tracking-[-0.01em]">How to choose</h2>
            <ul className="mt-6 space-y-4 text-[15.5px] text-ink-2 leading-relaxed">
              <li><strong className="text-ink font-semibold">Want a real scorecard, not a chat?</strong> Look for letter grades per answer, a skill breakdown, and delivery scoring — not just a transcript. That’s the core of HARDO.</li>
              <li><strong className="text-ink font-semibold">Targeting a specific bank?</strong> Tools with broad, bank-specific question banks (e.g. Superday AI, IB Mock) help you rehearse a firm’s style.</li>
              <li><strong className="text-ink font-semibold">Want the whole funnel?</strong> If you also need resume help, networking and an application tracker, an all-in-one suite like Cook’d AI covers more than just interviews.</li>
              <li><strong className="text-ink font-semibold">On a budget?</strong> Check what’s free and whether a card is required up front. HARDO gives one full interview free with no card.</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {COMPARISONS.map((c) => (
                <Link key={c.slug} href={`/compare/${c.slug}`} className="inline-block text-[12px] font-mono uppercase tracking-widest border border-line hover:border-ink px-4 py-2 rounded-full transition-colors">
                  {c.h1}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-cream/60">
          <div className="max-w-page mx-auto px-6 py-20 text-center">
            <h2 className="font-serif text-[34px] md:text-[46px] font-light leading-[1.06] tracking-[-0.02em] max-w-3xl mx-auto">
              The best tool is the one you actually sit.
            </h2>
            <p className="mt-5 text-ink-2 max-w-xl mx-auto leading-relaxed">
              Take HARDO’s free mock interview — twelve questions, a real scorecard, no card.
            </p>
            <Link href="/ai-investment-banking-mock-interview" className="mt-8 inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-navy transition-colors">
              See HARDO’s AI mock interview <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
      <JsonLd
        data={[
          breadcrumbLd([
            { name: 'Home', url: '/' },
            { name: 'Best AI IB Mock Interview Tools', url: PATH },
          ]),
          itemList,
        ]}
      />
    </>
  );
}
