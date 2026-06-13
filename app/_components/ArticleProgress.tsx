'use client';

import { useEffect, useState } from 'react';

/** Thin gold reading-progress bar pinned to the very top of the page. */
export default function ArticleProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[3px] pointer-events-none" aria-hidden>
      <div
        className="h-full bg-gold origin-left transition-transform duration-100 ease-out"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  );
}
