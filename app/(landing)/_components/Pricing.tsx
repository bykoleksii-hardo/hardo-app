import Reveal from '@/app/_components/Reveal';
import Link from 'next/link';

const FREE_FEATURES = [
  <>One full <strong className="font-medium text-ink">Intern-level</strong> interview</>,
  <>Full scorecard &amp; recommendation</>,
  <>Saved to your profile</>,
];

const PAID_FEATURES = [
  <><strong className="font-medium">Unlimited</strong> interviews across all three rooms</>,
  <>Intern, Analyst &amp; Associate question pools</>,
  <>Question Vault &mdash; <strong className="font-medium">Deep Dive</strong> any question</>,
  <>Voice answers &middot; Whisper transcription</>,
  <>Full Knowledge Hub &mdash; playbooks &amp; breakdowns</>,
  <>Full history &amp; trend tracking</>,
];

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-line">
      <Reveal>
        <div className="max-w-page mx-auto px-6 py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end mb-14">
            <div>
              <div className="kicker mb-3">Pricing</div>
              <h2 className="font-serif text-[44px] md:text-[56px] font-light leading-[1.04] tracking-[-0.022em] max-w-2xl">
                One free try. One plan. <em className="text-gold italic font-light">Cancel anytime.</em>
              </h2>
              <p className="mt-5 text-ink-2 max-w-xl leading-relaxed">
                Pricing in USD. Renews monthly until canceled {'\u2014'} no contract, no annual lock-in.
              </p>
            </div>
            <blockquote className="border-l-2 border-gold pl-5 font-serif italic text-[17px] text-ink-2 leading-snug max-w-sm">
              {'\u201c'}Cheaper than one hour with a tutor. Drill as many as you like.{'\u201d'}
            </blockquote>
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
            {/* FREE */}
            <div className="lift border border-line rounded-lg p-8 md:p-10 bg-paper flex flex-col">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Free</div>
              <div className="mt-6 flex items-end gap-3">
                <span className="font-serif text-[64px] font-light leading-none">$0</span>
                <span className="text-[12px] text-muted font-mono leading-tight pb-2">forever<br />no card</span>
              </div>
              <div className="mt-8 border-t border-line" />
              <ul className="mt-8 space-y-4 text-[14.5px] text-ink-2 flex-1">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif italic text-muted text-[14px] w-5 shrink-0 leading-relaxed">{ROMAN[i]}.</span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 border border-ink text-ink text-[13.5px] px-6 py-3 rounded-full hover:bg-ink hover:text-paper transition-colors"
                >
                  Sign up free <span aria-hidden className="transition-transform group-hover:translate-x-0.5">{'\u2192'}</span>
                </Link>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted">{'\u2014'} No card required</p>
              </div>
            </div>

            {/* PAID */}
            <div className="lift relative rounded-lg p-8 md:p-10 bg-ink text-paper flex flex-col overflow-hidden">
              <div className="absolute top-6 right-0 bg-gold text-ink text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded-l-full flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink" /> Recommended
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-gold">Subscription</div>
              <div className="mt-1 font-serif text-[24px] font-medium">HARDO</div>
              <div className="mt-5 flex items-start gap-2">
                <span className="font-serif text-[68px] font-light leading-none">$14</span>
                <span className="font-serif text-[30px] font-light leading-none mt-2">.99</span>
                <span className="text-[12px] text-paper/60 font-mono leading-tight mt-3 ml-2">per month<br />cancel anytime</span>
              </div>
              <div className="mt-8 border-t border-paper/15" />
              <ul className="mt-8 space-y-4 text-[14.5px] text-paper/85 flex-1">
                {PAID_FEATURES.map((f, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif italic text-gold text-[14px] w-5 shrink-0 leading-relaxed">{ROMAN[i]}.</span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/upgrade"
                  className="group inline-flex items-center gap-2 bg-gold text-ink text-[13.5px] font-medium px-6 py-3 rounded-full hover:bg-gold-2 transition-colors"
                >
                  Unlock unlimited access <span aria-hidden className="transition-transform group-hover:translate-x-0.5">{'\u2192'}</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-line flex flex-col md:flex-row md:items-center md:justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-muted">
            <p>
              <span className="line-through">$200+ / hour with a coach</span> {'\u2192'} <span className="text-ink">$14.99 / month, unlimited.</span>
            </p>
            <p>{'\u2014'} Cancel in two clicks {'\u00b7'} keep access to period end</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
