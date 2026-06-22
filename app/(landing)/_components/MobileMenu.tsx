'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  signedIn?: boolean;
  isAdmin?: boolean;
  isPaid?: boolean;
  onLanding?: boolean;
};

export default function MobileMenu({ signedIn = false, isAdmin = false, isPaid = false, onLanding = false }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);
  const linkClass =
    'flex items-center min-h-[44px] px-1 text-[15px] text-ink-2 hover:text-ink border-b border-line';

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-flex items-center justify-center w-11 h-11 -mr-2 text-ink"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu-panel"
          className="fixed inset-x-0 top-16 z-40 border-b border-line bg-paper/98 backdrop-blur px-6 pb-6 pt-2"
        >
          <nav className="flex flex-col">
            {onLanding && (
              <>
                <Link href="/#how" onClick={close} className={linkClass}>How it works</Link>
                {!isPaid && <Link href="/#pricing" onClick={close} className={linkClass}>Pricing</Link>}
                <Link href="/#faq" onClick={close} className={linkClass}>FAQ</Link>
              </>
            )}
            <Link href="/knowledge" onClick={close} className={linkClass}>Knowledge Hub</Link>
            <Link href={signedIn ? '/vault' : '/login'} onClick={close} className={linkClass}>Question Vault</Link>
            {isAdmin && (
              <>
                <Link href="/admin/knowledge" onClick={close} className={linkClass}>Admin · Knowledge Hub</Link>
                <Link href="/admin/questions" onClick={close} className={linkClass}>Admin · Question Lab</Link>
              </>
            )}
            {signedIn ? (
              <Link href="/profile" onClick={close} className={linkClass}>Profile</Link>
            ) : (
              <Link href="/login" onClick={close} className={linkClass}>Sign in</Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
