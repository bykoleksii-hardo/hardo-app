import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Not found — HARDO',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted mb-4">
          404 · Wrong door
        </div>
        <h1 className="font-serif text-[44px] sm:text-[56px] font-light leading-[1.05] tracking-[-0.022em]">
          This page isn’t in the room.
        </h1>
        <p className="mt-5 text-ink-2 text-[15px] leading-relaxed max-w-md mx-auto">
          The page you were looking for doesn’t exist, or has moved.
          Twelve questions are still waiting for you.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-1.5 bg-ink text-paper text-[13.5px] px-5 py-2.5 rounded-full hover:bg-navy transition-colors"
          >
            Start an interview <span aria-hidden>{'→'}</span>
          </Link>
          <Link
            href="/"
            className="text-[13.5px] text-ink-2 hover:text-ink px-4 py-2.5"
          >
            Back to home
          </Link>
        </div>
        <div className="mt-12 font-mono text-[10.5px] uppercase tracking-widest text-muted">
          HARDO · The room is always open.
        </div>
      </div>
    </main>
  );
}
