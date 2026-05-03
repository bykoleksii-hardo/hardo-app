import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getViewerPlan } from '@/lib/quota/server';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';

export const metadata: Metadata = {
  title: 'Upgrade \u2014 HARDO',
  description: 'Switch to HARDO for unlimited interviews across all three rooms.',
};

export const dynamic = 'force-dynamic';

export default async function UpgradePage() {
  const viewer = await getViewerPlan();
  if (viewer.plan === 'anon') redirect('/signup?next=/upgrade');

  const isPaid = viewer.plan === 'paid';

  return (
    <>
      <LandingHeader signedIn />
      <main>
        <section className="border-b border-line">
          <div className="max-w-page mx-auto px-6 pt-20 pb-16">
            <div className="kicker mb-3">Account {'\u00b7'} Subscription</div>
            <h1 className="font-serif text-[44px] md:text-[58px] font-light leading-[1.05] tracking-[-0.022em] max-w-3xl">
              {isPaid ? 'You\u2019re on HARDO. Unlimited.' : 'Switch to HARDO. Unlimited interviews.'}
            </h1>
            <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
              {isPaid
                ? 'Your subscription is active. Manage billing or cancel anytime below \u2014 access continues through the end of the current period.'
                : 'One plan, $12 a month, billed monthly. Cancel anytime. No annual lock-in.'}
            </p>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="max-w-page mx-auto px-6 py-16 grid gap-10 md:grid-cols-2">
            <div className="border border-ink rounded-md p-8 bg-cream relative">
              <div className="absolute -top-3 left-8 bg-ink text-paper text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full">
                {isPaid ? 'Current plan' : 'Subscription'}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted">HARDO</div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-serif text-[56px] font-light leading-none">$12</span>
                <span className="text-[13px] text-muted">/ month {'\u00b7'} cancel anytime</span>
              </div>
              <ul className="mt-8 space-y-3 text-[14.5px] text-ink-2">
                <li>Unlimited interviews across Intern, Analyst, and Associate</li>
                <li>Voice answers with Whisper transcription</li>
                <li>Full history and trend tracking</li>
                <li>Knowledge Hub access (when articles ship)</li>
              </ul>

              {isPaid ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="mailto:hello@hardo.app?subject=Manage%20HARDO%20subscription"
                    className="inline-flex items-center gap-1.5 bg-ink text-paper text-[13.5px] px-5 py-2.5 rounded-full hover:bg-navy transition-colors"
                  >
                    Manage subscription <span aria-hidden>{'\u2192'}</span>
                  </a>
                  <Link
                    href="/profile"
                    className="inline-flex items-center text-[13.5px] text-ink-2 hover:text-ink"
                  >
                    Back to profile
                  </Link>
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="mailto:hello@hardo.app?subject=Upgrade%20to%20HARDO"
                    className="inline-flex items-center gap-1.5 bg-ink text-paper text-[13.5px] px-5 py-2.5 rounded-full hover:bg-navy transition-colors"
                  >
                    Get HARDO <span aria-hidden>{'\u2192'}</span>
                  </a>
                  <Link
                    href="/setup"
                    className="inline-flex items-center text-[13.5px] text-ink-2 hover:text-ink"
                  >
                    Use my free interview first
                  </Link>
                </div>
              )}
            </div>

            <div className="border border-line rounded-md p-8 bg-paper">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Why upgrade</div>
              <h2 className="mt-3 font-serif text-[26px] font-medium leading-snug">
                Stop guessing if you{'\u2019'}re ready.
              </h2>
              <p className="mt-4 text-[14.5px] text-ink-2 leading-relaxed">
                The free interview is a single Intern-level session. HARDO opens up Analyst and Associate rooms, where the case is harder, follow-ups go deeper, and the bar is closer to a real superday.
              </p>
              <ul className="mt-6 space-y-2 text-[13.5px] text-ink-2">
                <li>{'\u2022'} 3 rooms vs. 1</li>
                <li>{'\u2022'} Up to 5 follow-ups on the case (vs. 2 on standard)</li>
                <li>{'\u2022'} Trend tracking session-over-session</li>
                <li>{'\u2022'} $12 {'\u00b7'} less than one hour with a tutor.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <div className="max-w-page mx-auto px-6 py-16">
            <div className="kicker mb-3">Billing FAQ</div>
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
              <div className="border-t border-line pt-5">
                <h3 className="font-serif text-[18px] font-medium">When am I charged?</h3>
                <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">The first charge is on the day you subscribe. After that, on the same day each month until you cancel.</p>
              </div>
              <div className="border-t border-line pt-5">
                <h3 className="font-serif text-[18px] font-medium">Can I cancel anytime?</h3>
                <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">Yes. You keep access until the end of the period you{'\u2019'}ve already paid for. No partial refunds, no penalties.</p>
              </div>
              <div className="border-t border-line pt-5">
                <h3 className="font-serif text-[18px] font-medium">Do you offer annual?</h3>
                <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">Not yet. Monthly only, so the bar to try and stop is low.</p>
              </div>
              <div className="border-t border-line pt-5">
                <h3 className="font-serif text-[18px] font-medium">Refunds?</h3>
                <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">Email hello@hardo.app within 7 days of your first charge if HARDO didn{'\u2019'}t deliver \u2014 we{'\u2019'}ll refund the month.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
