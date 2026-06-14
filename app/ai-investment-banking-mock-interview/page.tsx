import Link from 'next/link';
import type { Metadata } from 'next';
import LandingFooter from '@/app/(landing)/_components/Footer';
import HeaderAuth from '@/app/_components/HeaderAuth';
import JsonLd from '@/app/_components/JsonLd';
import { listPublishedArticles } from '@/lib/knowledge/queries';
import { SITE_URL, SITE_NAME, abs, breadcrumbLd, faqLd, type FaqItem } from '@/lib/seo';

const PATH = '/ai-investment-banking-mock-interview';
const TITLE = 'AI Investment Banking Mock Interview Practice — HARDO';
const DESC =
  'Practice a realistic AI investment banking mock interview — 12 questions across technicals, behavioral and a case, graded on a real banker’s scorecard. One free, no card.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PATH },
  openGraph: { type: 'website', title: TITLE, description: DESC, url: PATH, images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.png'] },
};

// Static marketing page (ISR, revalidate daily). Reads only public data via the
// cookieless client, so it can be fully prerendered and served from the edge cache.
export const dynamic = 'force-static';
export const revalidate = 86400;

// Curated deep-link targets into the Knowledge Hub. Gated on existence below so a
// renamed/unpublished slug degrades to plain text instead of a dead link.
const GUIDES = {
  dcf: 'how-to-walk-through-a-dcf-like-youve-done-it',
  comps: 'comparable-companies-pick-adjust-defend',
  lbo: 'lbo-mechanics-from-sources-uses-to-irr-bridge',
  accretion: 'accretion-dilution-math-under-pressure',
  whyib: 'why-investment-banking-answers-that-survive-pushback',
  resume: 'walk-me-through-your-resume-the-90-second-structure',
  threeQ: 'the-three-questions-that-decide-most-first-round-ib-interviews',
};

const PAGE_FAQ: FaqItem[] = [
  { q: 'Is HARDO’s AI investment banking mock interview free?', a: 'Your first full mock interview is free — no card required. After that it’s $14.99 per month for unlimited rooms, cancel anytime.' },
  { q: 'What does the mock interview cover?', a: 'Twelve questions per session across technicals (accounting, valuation, DCF, LBO, M&A, accretion/dilution), behavioral, and a live case — the same ground a real first-round and superday cover.' },
  { q: 'Is it voice or text?', a: 'Both. Answer out loud for real-room pressure with a live transcript, or type. The scorecard is the same either way.' },
  { q: 'How is the interview graded?', a: 'A letter grade on every answer, a six-axis skill radar, how far you held under follow-ups, and one of four hire calls — the rubric a real banker would use.' },
  { q: 'Which levels can I practice?', a: 'Three interviewer tiers — Intern, Analyst, and Associate — each pulling from its own question pool and graded against the bar for that level.' },
];

export default async function Page() {
  const slugs = new Set((await listPublishedArticles({ limit: 200 }).catch(() => [])).map((a) => a.slug));
  const G = (key: keyof typeof GUIDES, text: string) => {
    const slug = GUIDES[key];
    return slugs.has(slug)
      ? <Link href={`/knowledge/${slug}`} className="text-[#a87a1f] underline underline-offset-2 decoration-[#a87a1f]/40 hover:decoration-[#a87a1f]">{text}</Link>
      : <span>{text}</span>;
  };

  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: abs(PATH),
    description: DESC,
    offers: { '@type': 'Offer', price: '14.99', priceCurrency: 'USD' },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  return (
    <>
      <HeaderAuth onLanding />
      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <div className="max-w-page mx-auto px-6 pt-20 pb-16">
            <div className="kicker mb-3">AI mock interview · Investment banking</div>
            <h1 className="font-serif text-[44px] md:text-[64px] font-light leading-[1.04] tracking-[-0.022em] max-w-4xl">
              AI Investment Banking Mock Interview
            </h1>
            <p className="mt-5 text-[18px] text-ink-2 leading-relaxed max-w-2xl">
              Sit a full investment banking interview against an AI that grades like a banker — twelve questions,
              voice or text, a real scorecard at the end. Your first one is free, no card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login" className="inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-navy transition-colors">
                Try one free interview <span aria-hidden>→</span>
              </Link>
              <Link href="/#what-we-measure" className="text-[14px] text-ink-2 hover:text-ink underline underline-offset-4">
                See how grading works
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-widest text-muted">
              <span>No card required</span>
              <span>· 12 questions / session</span>
              <span>· Letter grade per answer</span>
            </div>
          </div>
        </section>

        {/* What it is */}
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-serif text-[30px] md:text-[36px] font-light tracking-[-0.01em]">What it is</h2>
            <p className="mt-5 text-[16.5px] text-ink-2 leading-relaxed">
              HARDO is an AI-powered investment banking mock interview. Each session runs twelve questions across
              technicals, behavioral, and a live case — the same ground a real first-round and superday cover — then
              grades every answer on a letter scale with a written verdict. No scheduling and no favors called in:
              run the interview at 2am the night before, as many times as you need.
            </p>
          </div>
        </section>

        {/* What it covers — keyword-rich + internal links */}
        <section className="border-b border-line bg-cream/40">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-serif text-[30px] md:text-[36px] font-light tracking-[-0.01em]">What the interview covers</h2>
            <div className="mt-6 space-y-5 text-[16.5px] text-ink-2 leading-relaxed">
              <p>
                <strong className="text-ink font-semibold">Technicals.</strong>{' '}
                {G('dcf', 'Walk through a DCF')} the way someone who has built one does, defend a{' '}
                {G('comps', 'trading comps')} set, run {G('lbo', 'LBO mechanics')} from sources &amp; uses to the
                IRR bridge, and do {G('accretion', 'accretion / dilution')} in your head when the inputs change.
              </p>
              <p>
                <strong className="text-ink font-semibold">Behavioral.</strong>{' '}
                The two questions that sink most candidates — {G('whyib', '“why investment banking”')} and{' '}
                {G('resume', '“walk me through your resume”')} — pushed with follow-ups until your answer either
                holds or thins.
              </p>
              <p>
                <strong className="text-ink font-semibold">The case.</strong>{' '}
                A deal walk with up to five follow-ups, exactly where a real interviewer digs.
              </p>
              <p className="text-[15px]">
                Not sure where you stand? Start with{' '}
                {G('threeQ', 'the three questions that decide most first-round IB interviews')}.
              </p>
            </div>
          </div>
        </section>

        {/* Why different */}
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-serif text-[30px] md:text-[36px] font-light tracking-[-0.01em]">Why HARDO is not a chatbot</h2>
            <ul className="mt-6 space-y-4 text-[16.5px] text-ink-2 leading-relaxed">
              <li><strong className="text-ink font-semibold">Three interviewer tiers.</strong> Intern, Analyst, and Associate — each graded against the bar for that level, not a generic one.</li>
              <li><strong className="text-ink font-semibold">A real scorecard.</strong> A letter grade on every answer, a six-axis skill radar, follow-up depth, and one of four hire calls — the verdict a director would write.</li>
              <li><strong className="text-ink font-semibold">Delivery is scored too.</strong> In voice mode, pace, filler, and jargon hygiene are on the report — not just whether the numbers tied.</li>
              <li><strong className="text-ink font-semibold">Voice or text.</strong> Answer out loud with a live transcript, or type. Same rubric either way.</li>
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-b border-line bg-cream/40">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-serif text-[30px] md:text-[36px] font-light tracking-[-0.01em]">Pricing</h2>
            <p className="mt-5 text-[16.5px] text-ink-2 leading-relaxed">
              One full mock interview is free — no card. After that, unlimited rooms for{' '}
              <strong className="text-ink font-semibold">$14.99/month</strong>, cancel anytime. You only enter
              payment when you choose to subscribe.
            </p>
            <Link href="/login" className="mt-7 inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-navy transition-colors">
              Start your free interview <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <div className="kicker mb-3">FAQ</div>
            <h2 className="font-serif text-[30px] md:text-[36px] font-light tracking-[-0.01em]">AI mock interview — common questions</h2>
            <div className="mt-8 border-t border-line">
              {PAGE_FAQ.map((item, i) => (
                <details key={item.q} className="group border-b border-line py-5" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex items-center justify-between gap-6 cursor-pointer">
                    <span className="font-serif text-[19px] font-medium">{item.q}</span>
                    <span className="font-mono text-[18px] text-muted group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-4 text-[15px] text-ink-2 leading-relaxed max-w-2xl">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-cream/60">
          <div className="max-w-page mx-auto px-6 py-20 text-center">
            <h2 className="font-serif text-[36px] md:text-[48px] font-light leading-[1.06] tracking-[-0.02em] max-w-3xl mx-auto">
              Run the mock before the real one.
            </h2>
            <p className="mt-5 text-ink-2 max-w-xl mx-auto leading-relaxed">
              Take the free interview. The scorecard will tell you exactly where the bar is.
            </p>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-navy transition-colors">
              Try one free interview <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
      <JsonLd
        data={[
          breadcrumbLd([
            { name: 'Home', url: '/' },
            { name: 'AI Investment Banking Mock Interview', url: PATH },
          ]),
          faqLd(PAGE_FAQ),
          softwareLd,
        ]}
      />
    </>
  );
}
