'use client';

import { useEffect, useState } from 'react';

/**
 * Counts a number up from 0 to `value` on mount (eased). Used for the
 * scorecard's headline figures. Instant under prefers-reduced-motion.
 */
export default function CountUp({
  value,
  decimals = 0,
  durationMs = 1100,
}: {
  value: number;
  decimals?: number;
  durationMs?: number;
}) {
  const [v, setV] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setV(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <span>{v.toFixed(decimals)}</span>;
}
