import Link from 'next/link';
import type { Metadata } from 'next';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';
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
  const role = signedIn ? await getUserRole() : 'user';
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';

  return (
    <>
      <LandingHeader signedIn={signedIn} isAdmin={isAdmin} isPaid={isPaid} onLanding />
      <main className={viewer.plan === 'anon' ? 'pb-24 md:pb-0' : undefined}>
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
      <LandingFooter signedIn={signedIn} isPaid={isPaid} />
    </>
  );
}

function AnonHero() {
  return (
    <section className="relative border-b border-line overflow-hidden">
      <div className="max-w-page mx-auto px-6 pt-20 pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center hero-fade-in">
        <div>
          <div className="eyebrow mb-5">AI mock interviews {'\u00b7'} Investment banking</div>
          <h1 className="font-serif text-[56px] md:text-[78px] font-light leading-[1.02] tracking-[-0.022em] max-w-[16ch]">
            Practice against the bar.{' '}
            <span className="italic-gold">Not a chatbot</span>
            <span className="text-gold">.</span>
          </h1>
          <p className="mt-6 text-[17px] text-ink-2 leading-relaxed max-w-xl">
            Twelve questions per session. Technicals, behavioral, a case. Voice or text. A real scorecard at the end {'\u2014'} graded the way a real banker reviews a candidate.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy transition-colors hero-pulse"
            >
              Try one free interview {'\u2192'}
            </Link>
            <a href="#how" className="text-[14px] text-ink-2 hover:text-ink">How it works</a>
          </div>
          <p className="mt-3 text-[13px] text-[color:var(--muted)]">Email + password. Verification code on first sign-up.</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-mono uppercase tracking-widest text-[color:var(--muted)]">
            <span>No card required</span>
            <span>{'\u00b7'} 12 questions / session</span>
            <span>{'\u00b7'} 1 room</span>
            <span>{'\u00b7'} Letter grade per answer</span>
          </div>
        </div>
        <Scorecard />
      </div>
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-[12px] font-mono uppercase tracking-widest text-[color:var(--muted)]">No card required</span>
        <Link href="/login" className="inline-flex items-center justify-center gap-1.5 bg-ink text-paper text-[13px] px-5 py-2 min-h-[44px] rounded-full">
          Try free {'\u2192'}
        </Link>
      </div>
    </section>
  );
}

function FreeHero({ remaining }: { remaining: number }) {
  const left = Math.max(0, remaining);
  const noun = left === 1 ? 'interview' : 'interviews';
  return (
    <section className="relative border-b border-line overflow-hidden">
      <div className="max-w-page mx-auto px-6 pt-20 pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center hero-fade-in">
        <div>
          <div className="eyebrow mb-5">Welcome back {'\u00b7'} Free tier</div>
          <h1 className="font-serif text-[56px] md:text-[78px] font-light leading-[1.02] tracking-[-0.022em] max-w-[16ch]">
            Back to{' '}
            <span className="italic-gold">the bar</span>
            <span className="text-gold">.</span>
          </h1>
          <p className="mt-6 text-[17px] text-ink-2 leading-relaxed max-w-xl">
            You have <b className="text-ink font-medium">{left} {noun} left</b> on the free tier. Pick up where you stopped, or start a new room.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy transition-colors hero-pulse"
            >
              Continue {'\u2192'}
            </Link>
            <Link href="/profile" className="text-[14px] text-ink-2 hover:text-ink">
              Your profile
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-[color:var(--muted)]">Voice or text. Same scorecard either way.</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-mono uppercase tracking-widest text-[color:var(--muted)]">
            <span>{left}/1 free room left</span>
            <span>{'\u00b7'} 12 questions / session</span>
            <span>{'\u00b7'} Letter grade per answer</span>
          </div>
        </div>
        <Scorecard />
      </div>
    </section>
  );
}

function PaidHero() {
  return (
    <section className="relative border-b border-line overflow-hidden">
      <div className="max-w-page mx-auto px-6 pt-20 pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center hero-fade-in">
        <div>
          <div className="eyebrow mb-5">Welcome back {'\u00b7'} Paid {'\u00b7'} Unlimited</div>
          <h1 className="font-serif text-[56px] md:text-[78px] font-light leading-[1.02] tracking-[-0.022em] max-w-[16ch]">
            The room is{' '}
            <span className="italic-gold">always open</span>
            <span className="text-gold">.</span>
          </h1>
          <p className="mt-6 text-[17px] text-ink-2 leading-relaxed max-w-xl">
            Unlimited rooms. Full scorecard history. Pace, filler, jargon hygiene scored on delivery. Run one before the real one.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-1.5 bg-ink text-paper text-[14px] px-6 py-3 rounded-full hover:bg-navy transition-colors hero-pulse"
            >
              Start a room {'\u2192'}
            </Link>
            <Link href="/profile" className="text-[14px] text-ink-2 hover:text-ink">
              Your profile
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-[color:var(--muted)]">Voice with live Whisper transcript. Real banker rubric at the end.</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-mono uppercase tracking-widest text-[color:var(--muted)]">
            <span>Unlimited rooms</span>
            <span>{'\u00b7'} 12 questions / session</span>
            <span>{'\u00b7'} Letter grade per answer</span>
            <span>{'\u00b7'} Delivery score</span>
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
  const ctaHref = plan === 'paid' ? '/interview/setup' : plan === 'free' ? '/interview/setup' : '/login';
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
