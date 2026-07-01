import Link from 'next/link';
import Brand from '@/app/_components/Brand';
import SubscribeForm from './SubscribeForm';
import { SOCIAL_LINKS } from '@/lib/seo';

type Props = {
  signedIn?: boolean;
  isPaid?: boolean;
};

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export default function LandingFooter({ signedIn = false, isPaid = false }: Props) {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-page mx-auto px-6 py-12 grid gap-8 md:grid-cols-4 text-[13.5px]">
        <div className="md:col-span-2">
          <Brand size="md" />
          <p className="mt-4 max-w-sm text-ink-2 leading-relaxed">
            AI mock interviews for investment banking. Twelve questions per session, voice or text. Graded the way a banker reviews a candidate.
          </p>
          <SubscribeForm />
        </div>
        <div>
          <div className="kicker mb-3">Product</div>
          <ul className="space-y-2 text-ink-2">
            <li><Link href="/ai-investment-banking-mock-interview" className="hover:text-ink">AI Mock Interview</Link></li>
            <li><a href="/#how" className="hover:text-ink">How it works</a></li>
            {!isPaid && (
              <li><a href="/#pricing" className="hover:text-ink">Pricing</a></li>
            )}
            <li><Link href="/knowledge" className="hover:text-ink">Knowledge Hub</Link></li>
            <li><Link href="/vault" className="hover:text-ink">Question Vault</Link></li>
            {!isPaid && (
              <li><Link href="/upgrade" className="hover:text-ink">Upgrade</Link></li>
            )}
          </ul>
        </div>
        <div>
          <div className="kicker mb-3">Company</div>
          <ul className="space-y-2 text-ink-2">
            {signedIn ? (
              <li><Link href="/profile" className="hover:text-ink">Profile</Link></li>
            ) : (
              <>
                <li><Link href="/login" className="hover:text-ink">Sign in</Link></li>
                <li><Link href="/login" className="hover:text-ink">Sign up</Link></li>
              </>
            )}
            <li><a href="mailto:hello@hardo.app" className="hover:text-ink">Contact</a></li>
            <li><a href="mailto:suggestions@hardo.app?subject=HARDO%20Feedback%20%2F%20Suggestion" className="hover:text-ink">Feedback / Suggestions</a></li>
            <li><Link href="/legal/terms" className="hover:text-ink">Terms</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-ink">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-page mx-auto px-6 py-5 text-[12px] text-muted flex items-center justify-between">
          <span className="flex items-center gap-3">
            {'\u00a9'} {new Date().getFullYear()} HARDO. All rights reserved.
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="HARDO on LinkedIn"
              className="text-muted hover:text-ink transition-colors"
            >
              <LinkedInIcon />
            </a>
          </span>
          <span className="hidden md:inline">Built with Next.js, Cloudflare Workers, Supabase, OpenAI {'\u00b7'} Groq Whisper.</span>
          <span>Built for candidates, not hiring funnels.</span>
        </div>
      </div>
    </footer>
  );
}
