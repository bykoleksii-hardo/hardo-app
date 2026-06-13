'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** Positive drifts slower than scroll (deeper plane); ~0.08–0.3 reads as "light". */
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  ariaHidden?: boolean;
};

/**
 * Light, decorative parallax. Translates its own element on scroll relative to
 * the viewport centre — use only for non-content (atmosphere) so there's no
 * layout shift. No-op under prefers-reduced-motion.
 */
export default function Parallax({ speed = 0.15, className, style, children, ariaHidden }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const off = center - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-off * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ ...style, willChange: 'transform' }} aria-hidden={ariaHidden}>
      {children}
    </div>
  );
}
