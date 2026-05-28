import type { Metadata } from 'next';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { getViewerPlan } from '@/lib/quota/server';

export const metadata: Metadata = {
  title: 'Privacy Policy \u2014 HARDO',
  description: 'How HARDO collects, uses, and protects your data.',
};

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const viewer = await getViewerPlan();
  return (
    <>
      <LandingHeader signedIn={viewer.plan !== 'anon'} />
      <main>
        <article className="max-w-page mx-auto px-6 pt-16 pb-20 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start lg:h-fit">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted mb-4">On this page</div>
            <ol className="space-y-2 text-[13px] text-ink-2">
              <li><a className="hover:text-ink" href="#sec-1">What we collect</a></li>
              <li><a className="hover:text-ink" href="#sec-2">What we don{'\u2019'}t collect</a></li>
              <li><a className="hover:text-ink" href="#sec-3">How we use it</a></li>
              <li><a className="hover:text-ink" href="#sec-4">AI providers</a></li>
              <li><a className="hover:text-ink" href="#sec-5">Storage and security</a></li>
              <li><a className="hover:text-ink" href="#sec-6">Your rights</a></li>
              <li><a className="hover:text-ink" href="#sec-7">Cookies</a></li>
              <li><a className="hover:text-ink" href="#sec-8">Children</a></li>
              <li><a className="hover:text-ink" href="#sec-9">Changes</a></li>
              <li><a className="hover:text-ink" href="#sec-10">Data controller &amp; contact</a></li>
            </ol>
          </aside>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Legal</div>
          <h1 className="mt-3 font-serif text-[44px] md:text-[56px] font-light leading-[1.05] tracking-[-0.022em]">
            Privacy Policy
          </h1>
          <p className="mt-5 text-[15px] text-ink-2">Last updated: May 3, 2026</p>

          <div className="prose-hardo mt-10">
            <p>
              This Privacy Policy explains what HARDO collects, why, and how it{'\u2019'}s used. We aim to keep this short and accurate.
            </p>

            <h2 id="sec-1">1. What we collect</h2>
            <p>
              <strong>Account data.</strong> Email, password hash, profile fields you choose to fill in (name, school, target start date, CV summary).
            </p>
            <p>
              <strong>Interview data.</strong> Your answers (text or voice), Whisper transcripts of voice answers, scorecards, and grades. Saved to your profile so you can review trends.
            </p>
            <p>
              <strong>Usage data.</strong> Standard server logs (timestamps, IP address, user agent), kept up to 30 days for abuse prevention and debugging.
            </p>
            <p>
              <strong>Payments.</strong> Handled by our merchant of record, LemonSqueezy. LemonSqueezy processes your card and billing details under its own privacy terms; we never receive your full card number, only a billing reference and the last four digits.</p>

            <h2 id="sec-2">2. What we don{'\u2019'}t collect</h2>
            <p>
              We do not collect biometric voiceprints, social-network graphs, browsing history outside HARDO, or location beyond the IP-derived country.
            </p>

            <h2 id="sec-3">3. How we use it</h2>
            <p>
              To run the service: grade your answers, save your history, send transactional emails, prevent abuse, and improve quality. We do not sell your data, and we do not train third-party models on your interview content.
            </p>

            <h2 id="sec-4">4. AI providers</h2>
            <p>
              HARDO uses OpenAI for question generation and grading and Groq for Whisper transcription. Your interview text and audio are sent to these providers under their data-processing terms; they do not train on it under their API terms of service.
            </p>

            <h2 id="sec-5">5. Storage and security</h2>
            <p>
              Data is stored in Supabase (Postgres) with row-level security. Access is restricted to your own account except where you explicitly share. Backups are encrypted at rest.
            </p>

            <h2 id="sec-6">6. Your rights</h2>
            <p>
              You can request export or deletion of your data at any time by emailing <a href="mailto:hello@hardo.app">hello@hardo.app</a>. Deletion is permanent and removes interview transcripts and scorecards.
            </p>

            <h2 id="sec-7">7. Cookies</h2>
            <p>
              We use a session cookie to keep you signed in. We do not use third-party advertising or analytics cookies.
            </p>

            <h2 id="sec-8">8. Children</h2>
            <p>
              HARDO is not for users under 16. If you believe a minor has created an account, contact us and we{'\u2019'}ll remove it.
            </p>

            <h2 id="sec-9">9. Changes</h2>
            <p>
              Material changes will be announced 14 days in advance via email or in-app notice.
            </p>

            <h2 id="sec-10">10. Data controller &amp; contact</h2>
            <p>
              HARDO is a brand operated by a sole proprietor registered in Poland, who acts as the data controller for the personal data described above. You can reach the controller, including for any request under GDPR, at <a href="mailto:hello@hardo.app">hello@hardo.app</a>. You also have the right to lodge a complaint with your local data-protection supervisory authority.
            </p>
            </div>
          </div>
        </article>
      </main>
      <LandingFooter />
    </>
  );
}
