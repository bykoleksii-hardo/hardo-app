import Link from 'next/link';
import Brand from '@/app/_components/Brand';
import SubscribeForm from './SubscribeForm';

type Props = {
  signedIn?: boolean;
  isPaid?: boolean;
};

export default function LandingFooter({ signedIn = false, isPaid = false }: Props) {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-page mx-auto px-6 py-12 grid gap-8 md:grid-cols-4 text-[13.5px]">
        <div className="md:col-span-2">
          <Brand size="md" />
          <p className="mt-4 max-w-sm text-ink-2 leading-relaxed">
            AI mock interviews for investment banking. Twelve questions per session, voice or text, a real scorecard at the end.
          </p>
          <SubscribeForm />
        </div>
        <div>
          <div className="kicker mb-3">Product</div>
          <ul className="space-y-2 text-ink-2">
            <li><a href="/#how" className="hover:text-ink">How it works</a></li>
            <li><a href="/#voice" className="hover:text-ink">Voice mode</a></li>
            {!isPaid && (
              <li><a href="/#pricing" className="hover:text-ink">Pricing</a></li>
            )}
            <li><Link href="/knowledge" className="hover:text-ink">Knowledge Hub</Link></li>
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
          <span>{'\u00a9'} {new Date().getFullYear()} HARDO. All rights reserved.</span>
          <span className="hidden md:inline">Built with Next.js, Cloudflare Workers, Supabase, OpenAI {'\u00b7'} Whisper.</span>
          <span>Built for candidates, not hiring funnels.</span>
        </div>
      </div>
    </footer>
  );
}
