import Link from 'next/link';
import type { Metadata } from 'next';
import { getViewerPlan } from '@/lib/quota/server';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import HowItWorks from '@/app/(landing)/_components/HowItWorks';
import WhatWeMeasure from '@/app/(landing)/_components/WhatWeMeasure';
import Pricing from '@/app/(landing)/_components/Pricing';
import FAQ from '@/app/(landing)/_components/FAQ';
import KnowledgeTeaser from '@/app/(landing)/_components/KnowledgeTeaser';

export const metadata: Metadata = {
  title: 'HARDO {\u2014} AI mock interviews for IB',
  description: 'AI-powered Investment Banking mock interviews. Get graded against the real bar before you sit the real one. $12/month, cancel anytime.',
};

export default async function HomePage() {
  const { plan, interviews_remaining, interviews_used } = await getViewerPlan();

  return (
    <>
      <LandingHeader />
      <main>
        {plan === 'anon' && <AnonHero />}
        {plan === 'free' && (
          <FreeHero interviewsRemaining={interviews_remaining ?? Math.max(0, 1 - interviews_used)} />
        )}
        {plan === 'paid' && <PaidHero />}

        {plan !== 'paid' && <HowItWorks />}
        {plan === 'paid' && <PaidValueStrip />}

        <WhatWeMeasure />

        {plan !== 'paid' && <Pricing variant={plan} />}

        <KnowledgeTeaser />

        <FAQ variant={plan} />

        {plan !== 'paid' && <BottomCTA variant={plan} />}
      </main>
      <LandingFooter />
    </>
  );
}

function AnonHero() {
  return (
    <section className="pt-20 pb-24 border-b border-[#f5efe2]/10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-4">AI mock interviews for Investment Banking</div>
          <h1 className="font-serif text-5xl md:text-7xl text-[#f5efe2] leading-[1.05] mb-6">
            Land your IB offer.
            <br />
            <span className="text-[#d4a04a]">Practice against the bar.</span>
          </h1>
          <p className="text-[#f5efe2]/70 text-lg max-w-xl mb-8 leading-relaxed">
            Twelve questions per session. Technicals, behavioral, and a case. Voice or text. A real scorecard at the end {'\u2014'} not a chatbot {'\u201c'}great job{'\u201d'}.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium px-8 py-4 rounded hover:bg-[#d4a04a]/90 transition">Try one free interview</Link>
            <Link href="#how" className="inline-block border border-[#f5efe2]/30 text-[#f5efe2] px-8 py-4 rounded hover:border-[#d4a04a] hover:text-[#d4a04a] transition">How it works</Link>
          </div>
          <div className="text-[#f5efe2]/40 text-xs mt-6">No card required for the free interview.</div>
        </div>
        <div className="md:col-span-5">
          <SampleScorecard />
        </div>
      </div>
    </section>
  );
}

function FreeHero({ interviewsRemaining }: { interviewsRemaining: number }) {
  const used = interviewsRemaining <= 0;
  return (
    <section className="pt-16 pb-20 border-b border-[#f5efe2]/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">Welcome back</div>
        <h1 className="font-serif text-4xl md:text-6xl text-[#f5efe2] mb-4 leading-tight max-w-3xl">
          {used ? 'Your free interview is used.' : 'You have one free interview waiting.'}
        </h1>
        <p className="text-[#f5efe2]/70 text-lg max-w-2xl mb-8 leading-relaxed">
          {used
            ? `Upgrade to Hardo for unlimited interviews across all three levels \u2014 Intern, Analyst, and Associate.`
            : `Take the free Intern-level interview. When you\u2019re ready for Analyst and Associate pools, upgrade to Hardo.`}
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <div className="border border-[#f5efe2]/15 rounded-lg p-6 bg-[#0a1628]/40">
            <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-2">Free</div>
            <div className="text-[#f5efe2] text-2xl font-medium mb-3">{used ? '0 interviews left' : '1 Intern interview left'}</div>
            <p className="text-[#f5efe2]/60 text-sm mb-6 leading-relaxed">Full scorecard. Saved to your profile. No card on file.</p>
            <Link href={used ? '#pricing' : '/interview/setup'} className={used ? 'block text-center border border-[#f5efe2]/30 text-[#f5efe2] py-3 rounded hover:border-[#d4a04a] hover:text-[#d4a04a] transition' : 'block text-center bg-[#f5efe2] text-[#0a1628] font-medium py-3 rounded hover:bg-[#f5efe2]/90 transition'}>
              {used ? 'See pricing' : 'Start free interview'}
            </Link>
          </div>
          <div className="border border-[#d4a04a] rounded-lg p-6 bg-[#d4a04a]/5">
            <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-2">Hardo {'\u2014'} $12/mo</div>
            <div className="text-[#f5efe2] text-2xl font-medium mb-3">Unlimited interviews. All levels.</div>
            <p className="text-[#f5efe2]/60 text-sm mb-6 leading-relaxed">Intern, Analyst, Associate. Voice answers. Full history. Cancel anytime.</p>
            <Link href="/account/upgrade" className="block text-center bg-[#d4a04a] text-[#0a1628] font-medium py-3 rounded hover:bg-[#d4a04a]/90 transition">Upgrade to Hardo</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaidHero() {
  return (
    <section className="pt-20 pb-24 border-b border-[#f5efe2]/10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-4">Welcome back to HARDO</div>
          <h1 className="font-serif text-5xl md:text-7xl text-[#f5efe2] leading-[1.05] mb-6">Ready for the next rep?</h1>
          <p className="text-[#f5efe2]/70 text-lg max-w-xl mb-8 leading-relaxed">
            Pick a level. Get twelve questions, a clock, and a real scorecard at the end. Your history is saved on your profile.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/interview/setup" className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium px-8 py-4 rounded hover:bg-[#d4a04a]/90 transition">Start interview</Link>
            <Link href="/profile" className="inline-block border border-[#f5efe2]/30 text-[#f5efe2] px-8 py-4 rounded hover:border-[#d4a04a] hover:text-[#d4a04a] transition">View profile</Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <SampleScorecard />
        </div>
      </div>
    </section>
  );
}

function PaidValueStrip() {
  const items = [
    { label: 'Levels', value: 'Intern / Analyst / Associate' },
    { label: 'Per session', value: '12 questions' },
    { label: 'Modes', value: 'Voice or text' },
    { label: 'Output', value: 'Letter grades + hire call' },
  ];
  return (
    <section className="py-16 border-b border-[#f5efe2]/10 bg-[#050d1a]/60">
      <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-2">{it.label}</div>
            <div className="text-[#f5efe2] font-medium">{it.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SampleScorecard() {
  const rows: Array<[string, string, string]> = [
    ['Technical', 'B+', 'Solid DCF mechanics. Missed terminal-value sanity check.'],
    ['Structure', 'A-', 'Clear answer-first framing. Good signposting.'],
    ['Communication', 'B', 'Pace good. Some filler on the case.'],
    ['Case depth', 'B+', 'Held up under 3 follow-ups.'],
  ];
  return (
    <div className="border border-[#f5efe2]/15 rounded-lg overflow-hidden bg-[#0a1628]/60">
      <div className="px-5 py-3 border-b border-[#f5efe2]/10 flex justify-between items-center">
        <span className="text-[#f5efe2]/40 uppercase tracking-widest text-xs">Sample scorecard</span>
        <span className="text-[#d4a04a] uppercase tracking-widest text-xs">Leaning hire</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([phase, grade, note]) => (
            <tr key={phase} className="border-b border-[#f5efe2]/5 last:border-0">
              <td className="px-5 py-3 text-[#f5efe2]/60 w-1/3">{phase}</td>
              <td className="px-2 py-3 text-[#d4a04a] font-serif text-lg">{grade}</td>
              <td className="px-5 py-3 text-[#f5efe2]/80">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BottomCTA({ variant }: { variant: 'anon' | 'free' }) {
  return (
    <section className="py-24 border-t border-[#f5efe2]/10">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-[#f5efe2] mb-6">
          {variant === 'anon' ? `Stop guessing if you\u2019re ready.` : 'Ready for unlimited reps?'}
        </h2>
        <p className="text-[#f5efe2]/70 text-lg mb-10 leading-relaxed">
          {variant === 'anon' ? 'One free interview. No card. See exactly where you stand against the bar.' : 'Hardo: $12/month, all levels, cancel anytime.'}
        </p>
        <Link href={variant === 'anon' ? '/login' : '/account/upgrade'} className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium px-10 py-4 rounded hover:bg-[#d4a04a]/90 transition">
          {variant === 'anon' ? 'Try one free interview' : 'Upgrade to Hardo'}
        </Link>
      </div>
    </section>
  );
}
