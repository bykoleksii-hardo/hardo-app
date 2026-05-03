import Link from 'next/link';

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-line">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">Pricing</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-3xl">
          One free try. One plan. Cancel anytime.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          Pricing in USD. Subscription renews monthly until canceled. No long-term contract, no annual lock-in.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="border border-line rounded-md p-8 bg-paper">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Free</div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-serif text-[56px] font-light leading-none">$0</span>
              <span className="text-[13px] text-muted">/ no card</span>
            </div>
            <ul className="mt-8 space-y-3 text-[14.5px] text-ink-2">
              <li>One full Intern-level interview</li>
              <li>Full scorecard and recommendation</li>
              <li>Saved to your profile</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-1.5 border border-ink text-ink text-[13.5px] px-5 py-2.5 rounded-full hover:bg-ink hover:text-paper transition-colors"
            >
              Sign up free <span aria-hidden>{'\u2192'}</span>
            </Link>
          </div>

          <div className="border border-ink rounded-md p-8 bg-cream relative">
            <div className="absolute -top-3 left-8 bg-ink text-paper text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full">
              Most picked
            </div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Subscription</div>
            <div className="mt-1 font-serif text-[22px] font-medium">HARDO</div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-[56px] font-light leading-none">$12</span>
              <span className="text-[13px] text-muted">/ month {'\u00b7'} cancel anytime</span>
            </div>
            <ul className="mt-8 space-y-3 text-[14.5px] text-ink-2">
              <li>Unlimited interviews across all three rooms</li>
              <li>Intern, Analyst, and Associate question pools</li>
              <li>Voice answers {'\u00b7'} Whisper transcription</li>
              <li>Full history and trend tracking</li>
            </ul>
            <Link
              href="/signup?plan=paid"
              className="mt-8 inline-flex items-center gap-1.5 bg-ink text-paper text-[13.5px] px-5 py-2.5 rounded-full hover:bg-navy transition-colors"
            >
              Get HARDO <span aria-hidden>{'\u2192'}</span>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-[13px] text-muted font-mono uppercase tracking-widest">
          $12 {'\u00b7'} less than one hour with a tutor.
        </p>
      </div>
    </section>
  );
}
