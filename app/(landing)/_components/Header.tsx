import Link from 'next/link';
import Brand from '@/app/_components/Brand';

type Props = {
  signedIn?: boolean;
  isAdmin?: boolean;
};

export default function LandingHeader({ signedIn = false, isAdmin = false }: Props) {
  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between">
        <Brand size="md" />
        <nav className="hidden md:flex items-center gap-7 text-[13.5px] text-ink-2">
          <a href="/#how" className="hover:text-ink">How it works</a>
          <a href="/#voice" className="hover:text-ink">Voice mode</a>
          <a href="/#pricing" className="hover:text-ink">Pricing</a>
          <Link href="/knowledge" className="hover:text-ink">Knowledge Hub</Link>
          <a href="/#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/knowledge"
              className="hidden sm:inline text-[11px] tracking-[0.18em] uppercase text-[#B88736] border border-[#B88736]/40 px-2 py-1 rounded-sm hover:border-[#B88736] transition-colors"
              title="Admin: Knowledge Hub"
            >
              Admin
            </Link>
          )}
          {signedIn ? (
            <Link href="/profile" className="text-[13.5px] text-ink-2 hover:text-ink">Profile</Link>
          ) : (
            <Link href="/login" className="text-[13.5px] text-ink-2 hover:text-ink hidden sm:inline">Sign in</Link>
          )}
          <Link
            href={signedIn ? '/interview/setup' : '/login'}
            className="inline-flex items-center gap-1.5 bg-ink text-paper text-[13px] px-4 py-2 rounded-full hover:bg-navy transition-colors"
          >
            {signedIn ? 'Start interview' : 'Try free'}
            <span aria-hidden>{'\u2192'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
