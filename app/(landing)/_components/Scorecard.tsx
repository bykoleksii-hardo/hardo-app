'use client';

import { useEffect, useRef, useState } from 'react';

const phases = [
  { name: 'Accounting', grade: 'B', note: 'Solid LIFO/FIFO mechanics. Missed working-capital sanity check.' },
  { name: 'Valuation', grade: 'A', note: 'Clean DCF setup. Good push on terminal-value assumptions.' },
  { name: 'Corporate Finance', grade: 'B', note: 'WACC build was tight. Beta unlevering was rushed.' },
  { name: 'M&A / Case', grade: 'B', note: 'Reasonable deal logic. Synergy quantification thin.' },
  { name: 'Behavioral', grade: 'A', note: 'Answer-first framing. Held up under 3 follow-ups.' },
];

// The post-grade reveal shown inline under a category: what a strong answer had
// to cover + a model answer. Mirrors the product summary's reveal.
const VALUATION_KEY = {
  covers: [
    'Two methods: Gordon growth and an exit multiple on terminal EBITDA.',
    'Back out the implied exit multiple and sanity-check it against comps.',
    'Terminal value is 60–80% of EV — pressure-test g and WACC.',
  ],
  model:
    'Compute terminal value both ways — Gordon growth, FCF×(1+g)/(WACC−g), and an exit multiple on terminal EBITDA — then back the implied multiple out of the Gordon TV and check it against trading comps. The two should converge.',
};

function gradeColor(g: string): string {
  const c = (g || '').trim().toUpperCase();
  if (!c) return 'text-[#11161E]/55';
  if (c.startsWith('A')) return 'text-[#1F6F3D]';
  if (c.startsWith('B')) return 'text-[#3F7A4A]';
  if (c.startsWith('C')) return 'text-[#A85A1F]';
  if (c.startsWith('D')) return 'text-[#9C2E2E]';
  if (c.startsWith('F')) return 'text-[#7A1F1F]';
  return 'text-[#11161E]/75';
}

export default function Scorecard() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const [depth, setDepth] = useState(0);

  // Reveal when scrolled into view (or immediately for reduced-motion / no-IO).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      setDepth(3.4);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setShown(true); io.disconnect(); break; }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count the follow-up depth up to 3.4 once revealed.
  useEffect(() => {
    if (!shown) return;
    const target = 3.4;
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDepth(Math.round(eased * target * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown]);

  return (
    <div
      ref={ref}
      className="border border-line bg-paper rounded-md shadow-[0_1px_0_rgba(14,30,54,0.04),0_30px_60px_-40px_rgba(14,30,54,0.35)]"
    >
      <div className="border-b border-line px-6 py-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-muted">
        <span>{'—'} Example output {'·'} Not your session</span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-[#1F6F3D] transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-0'}`} />
          Graded
        </span>
      </div>
      <div className="px-6 py-6 grid gap-1">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-serif text-[22px] font-medium">Analyst {'·'} M&amp;A round</div>
            <div className="text-[12.5px] text-muted mt-1">Recent session {'·'} 38m {'·'} Voice</div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Final recommendation</div>
            <div className="mt-1 font-serif text-[22px] font-medium">Leaning hire</div>
          </div>
          <div
            className="font-serif text-[56px] font-light leading-none text-ink transition-all duration-700 ease-out"
            style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'scale(0.7)' }}
          >
            A
          </div>
        </div>

        <div className="mt-6 grid divide-y divide-line border-t border-line">
          {phases.map((p, i) => (
            <div key={p.name} className="py-4">
              <div
                className="grid grid-cols-[110px_44px_1fr] items-start gap-4 transition-all duration-500 ease-out"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'none' : 'translateY(10px)',
                  transitionDelay: `${260 + i * 120}ms`,
                }}
              >
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted pt-1">{p.name}</div>
                <div
                  className={`font-serif text-[22px] font-medium leading-none ${gradeColor(p.grade)} transition-transform duration-500 ease-out`}
                  style={{ transform: shown ? 'none' : 'scale(1.25)', transitionDelay: `${320 + i * 120}ms` }}
                >
                  {p.grade}
                </div>
                <div className="text-[13px] text-[#11161E]/75 leading-snug">{p.note}</div>
              </div>

              {/* post-grade reveal: what a strong answer covers + the model answer */}
              {p.name === 'Valuation' && (
                <div
                  className="mt-3.5 ml-0 sm:ml-[126px] transition-all duration-500 ease-out"
                  style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? 'none' : 'translateY(8px)',
                    transitionDelay: shown ? '560ms' : '0ms',
                  }}
                >
                  <div className="pl-5" style={{ borderLeft: '2px solid var(--gold)' }}>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold">What a strong answer covers</div>
                    <ul className="mt-2.5 space-y-2">
                      {VALUATION_KEY.covers.map((c, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-ink/85">
                          <span className="mt-0.5 shrink-0 text-gold text-[11px] leading-none" aria-hidden>{'✓'}</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3.5">
                      <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">Model answer</div>
                      <p className="mt-1.5 font-serif italic text-[13px] leading-snug text-ink/80">{VALUATION_KEY.model}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4 font-mono text-[10.5px] uppercase tracking-widest text-muted flex items-center justify-between">
          <span>Follow-up depth {'·'} <span className="text-ink tabular-nums">{depth.toFixed(1)}</span> / 5</span>
          <span>Six-axis radar</span>
        </div>
      </div>
    </div>
  );
}
