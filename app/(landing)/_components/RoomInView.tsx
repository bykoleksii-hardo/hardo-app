'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Toggles `is-in` on its wrapper the first time it scrolls into view, which
 * drives the cascade / icon-draw entrance for The Room (CSS handles the rest).
 * Respects reduced-motion and degrades gracefully without IntersectionObserver.
 */
export default function RoomInView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setInView(true); io.disconnect(); break; }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={inView ? 'is-in' : undefined}>
      {children}
    </div>
  );
}
