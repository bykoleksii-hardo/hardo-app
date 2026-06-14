import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LandingFooter from '@/app/(landing)/_components/Footer';
import HeaderAuth from '@/app/_components/HeaderAuth';
import JsonLd from '@/app/_components/JsonLd';
import { COMPARISONS, getComparison, COMPARE_REVIEWED } from '@/lib/compare';
import { breadcrumbLd, faqLd } from '@/lib/seo';

export const dynamic = 'force-static';
export const revalidate = 86400;

type Params = { slug: string };

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return { title: 'Comparison not found — HARDO' };
  const url = `/compare/${c.slug}`;
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: c.title, description: c.description, url, images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description, images: ['/og.png'] },
  };
}

export default async function ComparePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  return (
    <>
      <HeaderAuth onLanding />
      <main>
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
            <div className="mb-6">
              <Link href="/best-ai-investment-banking-mock-interview-tools" className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink">
                <span aria-hidden>←</span> All AI IB interview tools
              </Link>
            </div>
            <div className="kicker mb-3">Comparison</div>
            <h1 className="font-serif text-[40px] md:text-[56px] font-light leading-[1.05] tracking-[-0.022em]">{c.h1}</h1>
            <p className="mt-5 text-[17px] text-ink-2 leading-relaxed">{c.intro}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="border border-line rounded-md bg-paper p-5">
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold-2">Pick HARDO if</div>
                <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{c.pickHardoIf}</p>
              </div>
              <div className="border border-line rounded-md bg-paper p-5">
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Pick {c.competitor} if</div>
                <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{c.pickRivalIf}</p>
              </div>
            </div>
            <div className="mt-7">
              <Link href="/login" className="inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-navy transition-colors">
                Try one free interview <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-b border-line bg-cream/40">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <h2 className="font-serif text-[28px] md:text-[34px] font-light tracking-[-0.01em]">HARDO vs {c.competitor} at a glance</h2>
            <div className="mt-7 overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="py-3 pr-4 font-mono text-[10.5px] uppercase tracking-widest text-muted font-normal"> </th>
                    <th className="py-3 px-4 font-serif text-[16px] font-medium">HARDO</th>
                    <th className="py-3 pl-4 font-serif text-[16px] font-medium">{c.competitor}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.feature} className="border-b border-line align-top">
                      <td className="py-4 pr-4 font-mono text-[10.5px] uppercase tracking-widest text-muted">{r.feature}</td>
                      <td className="py-4 px-4 text-ink leading-relaxed">{r.hardo}</td>
                      <td className="py-4 pl-4 text-ink-2 leading-relaxed">{r.rival}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12px] text-muted leading-relaxed">
              Based on each platform’s publicly available information as of {COMPARE_REVIEWED}; features and pricing change — check{' '}
              <a href={c.competitorUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-ink">{c.competitor}</a> directly for the latest.
            </p>
          </div>
        </section>

        {/* Where HARDO is different */}
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <h2 className="font-serif text-[28px] md:text-[34px] font-light tracking-[-0.01em]">Where HARDO is different</h2>
            <div className="mt-6 space-y-5">
              {c.hardoEdge.map((e) => (
                <div key={e.h}>
                  <h3 className="font-serif text-[19px] font-medium">{e.h}</h3>
                  <p className="mt-1.5 text-[15.5px] text-ink-2 leading-relaxed">{e.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Where rival may fit better (honesty) */}
        <section className="border-b border-line bg-cream/40">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <h2 className="font-serif text-[28px] md:text-[34px] font-light tracking-[-0.01em]">Where {c.competitor} may fit better</h2>
            <div className="mt-6 space-y-5">
              {c.rivalEdge.map((e) => (
                <div key={e.h}>
                  <h3 className="font-serif text-[19px] font-medium">{e.h}</h3>
                  <p className="mt-1.5 text-[15.5px] text-ink-2 leading-relaxed">{e.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <div className="kicker mb-3">FAQ</div>
            <h2 className="font-serif text-[28px] md:text-[34px] font-light tracking-[-0.01em]">Common questions</h2>
            <div className="mt-7 border-t border-line">
              {c.faq.map((item, i) => (
                <details key={item.q} className="group border-b border-line py-5" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex items-center justify-between gap-6 cursor-pointer">
                    <span className="font-serif text-[18px] font-medium">{item.q}</span>
                    <span className="font-mono text-[18px] text-muted group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-4 text-[15px] text-ink-2 leading-relaxed max-w-2xl">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-cream/60">
          <div className="max-w-page mx-auto px-6 py-20 text-center">
            <h2 className="font-serif text-[34px] md:text-[46px] font-light leading-[1.06] tracking-[-0.02em] max-w-3xl mx-auto">
              Stop comparing. Sit one.
            </h2>
            <p className="mt-5 text-ink-2 max-w-xl mx-auto leading-relaxed">
              Take the free interview and let the scorecard decide. No card required.
            </p>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-navy transition-colors">
              Try one free interview <span aria-hidden>→</span>
            </Link>
            <div className="mt-6">
              <Link href="/ai-investment-banking-mock-interview" className="text-[13.5px] text-ink-2 hover:text-ink underline underline-offset-4">
                What is HARDO’s AI mock interview?
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
      <JsonLd
        data={[
          breadcrumbLd([
            { name: 'Home', url: '/' },
            { name: 'AI IB interview tools', url: '/best-ai-investment-banking-mock-interview-tools' },
            { name: c.h1, url: `/compare/${c.slug}` },
          ]),
          faqLd(c.faq),
        ]}
      />
    </>
  );
}
