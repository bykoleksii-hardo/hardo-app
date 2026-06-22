import Link from 'next/link';
import Brand from '@/app/_components/Brand';
import MobileMenu from './MobileMenu';

type Props = {
  signedIn?: boolean;
  isAdmin?: boolean;
  isPaid?: boolean;
  onLanding?: boolean;
};

export default function LandingHeader({ signedIn = false, isAdmin = false, isPaid = false, onLanding = false }: Props) {
  return (
    <header className="border-b border-line bg-paper/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between">
        <Brand size="md" />
        <nav className="hidden md:flex items-center gap-7 text-[13.5px] text-ink-2">
        {onLanding && (
          <>
            <a href="/#how" className="nav-link hover:text-ink">How it works</a>
            {!isPaid && (
              <a href="/#pricing" className="nav-link hover:text-ink">Pricing</a>
            )}
          </>
        )}
        <Link href="/knowledge" className="nav-link hover:text-ink">Knowledge Hub</Link>
        <Link href={signedIn ? '/vault' : '/login'} className="nav-link hover:text-ink">Question Vault</Link>
        {onLanding && (
          <a href="/#faq" className="nav-link hover:text-ink">FAQ</a>
        )}
      </nav>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="hidden sm:block relative group">
              <button
                type="button"
                className="text-[11px] tracking-[0.18em] uppercase text-gold border border-gold/40 px-2.5 py-1 rounded-sm hover:border-gold hover:bg-gold-soft transition-colors inline-flex items-center gap-1.5"
                aria-haspopup="true"
              >
                Admin
                <span aria-hidden className="text-[9px] leading-none">{'\u25BE'}</span>
              </button>
              {/* Hover bridge prevents the menu from closing when the cursor moves down */}
              <div className="absolute right-0 top-full w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-opacity z-50">
                <div className="bg-paper border border-line rounded shadow-lg overflow-hidden">
                  <Link
                    href="/admin/knowledge"
                    className="block px-4 py-2.5 text-[12.5px] text-ink hover:bg-cream/60"
                  >
                    Knowledge Hub
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">Articles & posts</span>
                  </Link>
                  <Link
                    href="/admin/questions"
                    className="block px-4 py-2.5 text-[12.5px] text-ink hover:bg-cream/60 border-t border-line"
                  >
                    Question Lab
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">Test a question + answer</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
          {signedIn ? (
            <Link href="/profile" className="text-[13.5px] text-ink-2 hover:text-ink">Profile</Link>
          ) : (
            <Link href="/login" className="text-[13.5px] text-ink-2 hover:text-ink hidden sm:inline">Sign in</Link>
          )}
          <Link
            href={signedIn ? '/interview/setup' : '/login'}
            className="hdr-cta group inline-flex items-center justify-center gap-2 text-ink text-[13px] font-semibold px-5 py-2 min-h-[44px] rounded-full"
          >
            {signedIn ? 'Start interview' : 'Start free'}
            <span aria-hidden className="arr text-[15px] leading-none">{'\u2192'}</span>
          </Link>
          <MobileMenu signedIn={signedIn} isAdmin={isAdmin} isPaid={isPaid} onLanding={onLanding} />
        </div>
      </div>
    </header>
  );
}
