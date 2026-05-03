import Link from 'next/link';
import type { Metadata } from 'next';
import { getViewerPlan } from '@/lib/quota/server';
import LandingHeader from './(landing)/_components/Header';
import LandingFooter from './(landing)/_components/Footer';
import HowItWorks from './(landing)/_components/HowItWorks';
import WhatWeMeasure from './(landing)/_components/WhatWeMeasure';
import VoiceMode from './(landing)/_components/VoiceMode';
import Pricing from './(landing)/_components/Pricing';
import KnowledgeTeaser from './(landing)/_components/KnowledgeTeaser';
import FAQ from './(landing)/_components/FAQ';
import Scorecard from './(landing)/_components/Scorecard';

export const metadata: Metadata = {
  title: 'HARDO \u2014 AI mock interviews for IB',
  description: 'Practice against the bar. Twelve questions per session, voice or text, a real scorecard at the end.',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const viewer = await getViewerPlan();
  const signedIn = viewer.plan !== 'anon';

  return (
    <>
      <LandingHeader signedIn={signedIn} />
      <main>
        {viewer.plan === 'anon' && <AnonHero />}
        {viewer.plan === 'free' && <FreeHero remaining={viewer.interviews_remaining ?? 0} />}
        {viewer.plan === 'paid' && <PaidHero />}

        <HowItWorks />
        <VoiceMode />
        <WhatWeMeasure />
        {viewer.plan !== 'paid' && <Pricing />}
        <KnowledgeTeaser />
        <FAQ showPricing={viewer.plan !== 'paid'} />
        <BottomCTA plan={viewer.plan} />
      </main>
      <LandingFooter />
    </>
  );
}

function AnonHero() {
  return (
    <section className="border-b border-line">
      <div className="max-w-page mx-auto px-6 pt-20 pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <div className="kicker mb-4">AI mock interviews {'\u00b7'} Investment banking</div>
          <h1 className="font-serif text-[56px] md:text-[78px] font-light leading-[1.02] tracking-[-0.022em]">
            Practice against the bar. Not a chatbot.
          </h1>
          <p className="mt-6 text-[17px] text-ink-2 leading-relaxed max-w-xl">
            Twelve questions per session. Technicals, behavioral, a case. Voice or text. A real scorecard at the end {'\u2014'} graded the way a real banker reviews a candidate.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy transition-colors"
            >
              Try one free interview <span aria-hidden>{'\u2192'}</span>
            </Link>
            <a href="#how" className="text-[14px] text-ink-2 hover:text-ink">How it works</a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-mono uppercase tracking-widest text-muted">
            <span>No card required.</span>
            <span>{'\u2022'} 12 questions / session</span>
            <span>{'\u2022'} 3 rooms</span>
            <span>{'\u2022'} 4-phase scorecard</span>
          </div>
        </div>
        <Scorecard />
      </div>
    </section>
  );
}

function FreeHero({ remaining }: { remaining: number }) {
  const hasFree = remaining > 0;
  return (
    <section className="border-b border-line">
      <div className="max-w-page mx-auto px-6 pt-20 pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <div className="kicker mb-4">Welcome back</div>
          <h1 className="font-serif text-[52px] md:text-[68px] font-light leading-[1.04] tracking-[-0.022em]">
            {hasFree ? 'Your free interview is ready.' : 'You\u2019ve used your free interview.'}
          </h1>
          <p className="mt-6 text-[17px] text-ink-2 leading-relaxed max-w-xl">
            {hasFree
              ? 'One full Intern-level session. Full scorecard at the end. No card required.'
              : 'Upgrade to HARDO for unlimited interviews across all three rooms, voice answers, and full history.'}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {hasFree ? (
              <Link href="/setup" className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy">
                Start free interview <span aria-hidden>{'\u2192'}</span>
              </Link>
            ) : (
              <Link href="/upgrade" className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy">
                Upgrade to HARDO {'\u00b7'} $12/mo
              </Link>
            )}
            <Link href="/profile" className="text-[14px] text-ink-2 hover:text-ink">View profile</Link>
          </div>
        </div>
        <Scorecard />
      </div>
    </section>
  );
}

function PaidHero() {
  return (
    <section className="border-b border-line">
      <div className="max-w-page mx-auto px-6 pt-20 pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <div className="kicker mb-4">HARDO subscription {'\u00b7'} active</div>
          <h1 className="font-serif text-[52px] md:text-[68px] font-light leading-[1.04] tracking-[-0.022em]">
            Pick a room. Sit the bar.
          </h1>
          <p className="mt-6 text-[17px] text-ink-2 leading-relaxed max-w-xl">
            Unlimited interviews across Intern, Analyst, and Associate. Voice or text. Full history saved to your profile.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/setup" className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy">
              Start interview <span aria-hidden>{'\u2192'}</span>
            </Link>
            <Link href="/profile" className="text-[14px] text-ink-2 hover:text-ink">View history</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 text-[12px] font-mono uppercase tracking-widest text-muted border-t border-line pt-6 max-w-xl">
            <div><div className="text-ink text-[16px] font-serif font-medium normal-case tracking-normal">3 rooms</div>Intern {'\u00b7'} Analyst {'\u00b7'} Associate</div>
            <div><div className="text-ink text-[16px] font-serif font-medium normal-case tracking-normal">12 Qs</div>per session</div>
            <div><div className="text-ink text-[16px] font-serif font-medium normal-case tracking-normal">Voice</div>or text</div>
            <div><div className="text-ink text-[16px] font-serif font-medium normal-case tracking-normal">{'A\u2212 .. F'}</div>per question</div>
          </div>
        </div>
        <Scorecard />
      </div>
    </section>
  );
}

function BottomCTA({ plan }: { plan: 'anon' | 'free' | 'paid' }) {
  const headline = plan === 'paid' ? 'Next session?' : 'Stop guessing if you\u2019re ready.';
  const sub = plan === 'paid'
    ? 'Pick a room and start when you have 30 minutes.'
    : 'Take the free Intern interview. The scorecard will tell you exactly where the bar is.';
  const ctaHref = plan === 'paid' ? '/setup' : plan === 'free' ? '/setup' : '/signup';
  const ctaText = plan === 'paid' ? 'Start interview' : plan === 'free' ? 'Start free interview' : 'Try one free interview';

  return (
    <section className="border-t border-line bg-cream/60">
      <div className="max-w-page mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-[44px] md:text-[56px] font-light leading-[1.05] tracking-[-0.02em] max-w-3xl mx-auto">
          {headline}
        </h2>
        <p className="mt-5 text-ink-2 max-w-xl mx-auto leading-relaxed">{sub}</p>
        <Link href={ctaHref} className="mt-8 inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy">
          {ctaText} <span aria-hidden>{'\u2192'}</span>
        </Link>
      </div>
    </section>
  );
}
