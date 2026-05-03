import type { Metadata } from 'next';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { getViewerPlan } from '@/lib/quota/server';

export const metadata: Metadata = {
  title: 'Terms of Service \u2014 HARDO',
  description: 'The terms that govern your use of HARDO.',
};

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const viewer = await getViewerPlan();
  return (
    <>
      <LandingHeader signedIn={viewer.plan !== 'anon'} />
      <main>
        <article className="max-w-3xl mx-auto px-6 pt-16 pb-20">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Legal</div>
          <h1 className="mt-3 font-serif text-[44px] md:text-[56px] font-light leading-[1.05] tracking-[-0.022em]">
            Terms of Service
          </h1>
          <p className="mt-5 text-[15px] text-ink-2">Last updated: May 3, 2026</p>

          <div className="prose-hardo mt-10">
            <p>
              These Terms govern your access to and use of HARDO {'\u2014'} an AI-driven mock-interview platform for investment banking candidates ({'\u201c'}HARDO{'\u201d'}, {'\u201c'}we{'\u201d'}, {'\u201c'}us{'\u201d'}). By creating an account or using the service you agree to these Terms.
            </p>

            <h2>1. The service</h2>
            <p>
              HARDO provides simulated interview sessions, automated scoring, and a written verdict. The service is a study tool. It is not a job placement service, an employer, or a recruiter, and the verdicts produced have no formal weight outside the platform.
            </p>

            <h2>2. Accounts</h2>
            <p>
              You are responsible for keeping your credentials secure and for activity on your account. You must be at least 16 years old to use HARDO.
            </p>

            <h2>3. Subscriptions and billing</h2>
            <p>
              The HARDO subscription is $12 per month, billed in USD. The subscription renews automatically each month until canceled. Cancellation takes effect at the end of the current billing period. We do not offer pro-rated refunds for partial months.
            </p>
            <p>
              The free tier is limited to one Intern-level interview per account and does not require a payment method.
            </p>

            <h2>4. Acceptable use</h2>
            <p>
              You agree not to: scrape or redistribute interview content, attempt to extract our prompts or grading rubric, use HARDO to generate content for sale, or attempt to evaluate other people through HARDO without their consent.
            </p>

            <h2>5. Content and IP</h2>
            <p>
              You own the answers you produce. We own the questions, rubric, scorecard format, and the platform itself. You grant us a limited license to process your answers for grading and to store them in your profile.
            </p>

            <h2>6. AI output and disclaimers</h2>
            <p>
              HARDO uses large language models to score and produce verdicts. Output may be wrong, biased, or inconsistent. The service is provided {'\u201c'}as is{'\u201d'} without warranties. HARDO is not a substitute for legal, career, or financial advice.
            </p>

            <h2>7. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these Terms. You may cancel your subscription or delete your account at any time from your profile.
            </p>

            <h2>8. Liability</h2>
            <p>
              To the extent permitted by law, our aggregate liability is limited to the amounts you paid us in the twelve months preceding the claim.
            </p>

            <h2>9. Changes</h2>
            <p>
              We may update these Terms; material changes will be announced via email or in-app notice at least 14 days before they take effect.
            </p>

            <h2>10. Contact</h2>
            <p>
              Questions: <a href="mailto:hello@hardo.app">hello@hardo.app</a>.
            </p>
          </div>
        </article>
      </main>
      <LandingFooter />
    </>
  );
}
