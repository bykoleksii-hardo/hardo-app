'use client';

import { useEffect, useState } from 'react';

/* A self-running demo of one interview *block* for the hero. Plays a full
   pass — question → voice answer → transcript → follow-up → voice answer →
   transcript → grading — then shows the block result the way the real
   summary does: a letter grade with a short read, what went well, and what
   to fix. Reuses the landing voice-card (.vcard) look and mirrors the
   product's per-block feedback shape. Honours prefers-reduced-motion by
   showing the block result statically. */

const BLOCK = { n: '02', name: 'Valuation', level: 'Analyst' };

type Turn = { kind: 'Question' | 'Follow-up'; q: string; a: string };
const TURNS: Turn[] = [
  {
    kind: 'Question',
    q: "Walk me through how you'd value a pre-revenue biotech with one Phase II asset.",
    a: 'Risk-adjusted NPV — build the peak-sales curve, then weight it by probability of success at each phase.',
  },
  {
    kind: 'Follow-up',
    q: 'Good. What discount rate would you use, and why?',
    a: "Given the binary clinical risk, I'd push the rate to 12–15% — well above a mature pharma.",
  },
];

/* Block result — same shape the real summary renders: grade + a read,
   what went well (+), what to fix (−). */
const RESULT = {
  grade: 'A−',
  meta: '2 questions · 1 follow-up · held to depth 1',
  summary:
    'Strong block. You framed a pre-revenue asset the right way — risk-adjusted, not a vanilla DCF — and reached for probability-weighting without being prompted.',
  strengths: [
    'Led with risk-adjusted NPV, weighted by phase — the right lens for one clinical asset.',
    'Pushed the discount rate to 12–15% for the binary clinical risk.',
  ],
  fixes: ['Anchor that 12–15% to a built-up rate, not a gut number.'],
};

type Sub = 'ask' | 'rec' | 'tx';
type Step =
  | { stage: 'turn'; turn: number; sub: Sub }
  | { stage: 'grading' }
  | { stage: 'result' };

const STEPS: Step[] = [
  { stage: 'turn', turn: 0, sub: 'ask' },
  { stage: 'turn', turn: 0, sub: 'rec' },
  { stage: 'turn', turn: 0, sub: 'tx' },
  { stage: 'turn', turn: 1, sub: 'ask' },
  { stage: 'turn', turn: 1, sub: 'rec' },
  { stage: 'turn', turn: 1, sub: 'tx' },
  { stage: 'grading' },
  { stage: 'result' },
];
const DUR = [2100, 2000, 3000, 1700, 1900, 2800, 1600, 5600];

// Grade-chip tone, matching the real per-question scorecard chip.
function gradeTone(g: string): string {
  const c = (g || '')[0];
  if (c === 'A') return 'border-[#1F6F3D]/40 text-[#1F6F3D] bg-[#1F6F3D]/8';
  if (c === 'B') return 'border-[#3F7A4A]/40 text-[#3F7A4A] bg-[#3F7A4A]/8';
  if (c === 'C') return 'border-[#A85A1F]/40 text-[#A85A1F] bg-[#A85A1F]/8';
  if (c === 'D') return 'border-[#9C2E2E]/40 text-[#9C2E2E] bg-[#9C2E2E]/8';
  return 'border-ink/20 text-ink/55';
}

const WAVE = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 15, 23, 11, 19, 27, 17, 25, 13, 21, 29, 14, 18, 22];

function tab(step: Step): { t: string; cls: string; dot: boolean } {
  if (step.stage === 'grading') return { t: 'Grading', cls: 'iv-card__tab--thinking', dot: true };
  if (step.stage === 'result') return { t: 'Block graded', cls: 'iv-card__tab--review', dot: false };
  if (step.sub === 'rec') return { t: 'Recording', cls: 'iv-card__tab--recording', dot: true };
  if (step.sub === 'tx') return { t: 'Transcribing', cls: 'iv-card__tab--transcribing', dot: true };
  return { t: TURNS[step.turn].kind, cls: 'iv-card__tab--ready', dot: false };
}

export default function InterviewDemo() {
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) { setReduced(true); return; }

    let raf = 0;
    let i = 0;
    let t0 = performance.now();
    const tick = (now: number) => {
      const e = now - t0;
      if (e >= DUR[i]) {
        i = (i + 1) % STEPS.length;
        t0 = now;
        setIdx(i);
        setElapsed(0);
      } else {
        setElapsed(e);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const step: Step = reduced ? { stage: 'result' } : STEPS[idx];
  const tb = tab(step);

  // Turns that are fully done (collapsed above the active area).
  const doneTurns = step.stage === 'turn' ? step.turn : TURNS.length;

  return (
    <div className="vcard !rotate-0" style={{ minHeight: 472 }}>
      <div
        className={`vcard__tab ${tb.cls}`}
        role="status"
        aria-live="off"
        style={{ width: 'auto', minWidth: 84, padding: '0 16px', gap: 8 }}
      >
        {tb.dot ? <span className="iv-card__tab-dot" aria-hidden /> : null}
        <span>{tb.t}</span>
      </div>

      <div className="vcard__head">
        <span>Block {BLOCK.n} {'·'} {BLOCK.name}</span>
        <span aria-hidden className="flex items-center gap-1.5">
          {TURNS.map((_, i) => (
            <span
              key={i}
              className="inline-block w-1.5 h-1.5 rounded-full transition-colors duration-500"
              style={{ background: i < doneTurns ? 'var(--gold)' : 'rgba(14,30,54,0.18)' }}
            />
          ))}
          <span className="ml-1.5">{BLOCK.level}</span>
        </span>
      </div>

      {step.stage === 'result' ? (
        <BlockResult reduced={reduced} />
      ) : (
        <div className="mt-4">
          {/* completed turns, collapsed */}
          {TURNS.slice(0, doneTurns).map((t, i) => (
            <div key={i} className="anim-fade flex items-start gap-2.5 py-2 border-b border-line/70">
              <span className="mt-0.5 text-gold text-[12px] leading-none" aria-hidden>{'✓'}</span>
              <div className="min-w-0">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">{t.kind}</div>
                <div className="text-[13px] text-ink/70 leading-snug truncate">{t.q}</div>
              </div>
            </div>
          ))}

          {/* active turn */}
          {step.stage === 'turn' && <ActiveTurn step={step} elapsed={elapsed} />}

          {/* grading */}
          {step.stage === 'grading' && (
            <div className="anim-fade mt-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span className="iv-card__tab-dot" style={{ background: 'rgba(14,30,54,0.5)' }} aria-hidden />
              Grading the {BLOCK.name} block{'…'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActiveTurn({ step, elapsed }: { step: Extract<Step, { stage: 'turn' }>; elapsed: number }) {
  const t = TURNS[step.turn];
  const isFollow = t.kind === 'Follow-up';
  const qChars = step.sub === 'ask' ? Math.floor(elapsed / 24) : t.q.length;
  const aChars = step.sub === 'tx' ? Math.floor(elapsed / 24) : 0;
  const recSec = step.sub === 'rec' ? Math.floor(elapsed / 1000) : 0;

  // Keyed on the turn only — the question stays mounted across sub-phases, so
  // only the meter / transcript fades in. Smoother than remounting each phase.
  return (
    <div key={step.turn} className="anim-fade mt-3">
      {isFollow && (
        <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold mb-1.5">Follow-up</div>
      )}
      <p className={isFollow ? 'font-serif italic text-[19px] leading-snug text-ink/90' : 'vcard__question !mt-0 !mb-0'}>
        {t.q.slice(0, qChars)}
        {step.sub === 'ask' && qChars < t.q.length ? <span className="vcard__caret" aria-hidden /> : null}
      </p>

      {step.sub === 'rec' && (
        <div className="vcard__meter mt-5 anim-fade">
          <div className="vcard__mic" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <line x1="12" y1="18" x2="12" y2="22" />
            </svg>
          </div>
          <div className="vcard__wave" aria-hidden>
            {WAVE.map((h, i) => (
              <i key={i} style={{ height: `${h}px`, animationDelay: `${(i % 8) * 0.09}s` }} />
            ))}
          </div>
          <div className="vcard__time">
            <b>0:{String(recSec).padStart(2, '0')}</b> <span className="cap">/ {isFollow ? '1:00' : '2:00'} cap</span>
          </div>
        </div>
      )}

      {step.sub === 'tx' && (
        <div className="anim-fade">
          <div className="vcard__transcript-label mt-5">Whisper {'·'} transcript</div>
          <div className="vcard__transcript">
            {t.a.slice(0, aChars)}
            {aChars < t.a.length ? <span className="vcard__caret" aria-hidden /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockResult({ reduced }: { reduced: boolean }) {
  // Stagger the sections in unless reduced-motion is requested.
  const at = (ms: number): React.CSSProperties =>
    reduced ? {} : { animation: `fade-rise 460ms cubic-bezier(0.16,1,0.3,1) ${ms}ms both` };

  return (
    <div className="mt-4">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-3" style={at(40)}>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Block score {'·'} {BLOCK.name}</div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/40">{RESULT.meta}</div>
        </div>
        <div className={`shrink-0 border ${gradeTone(RESULT.grade)} px-3 py-1.5 text-center min-w-[56px] ${reduced ? '' : 'rm-grade-pop'}`}>
          <div className="font-serif text-2xl leading-none">{RESULT.grade}</div>
          <div className="text-[8.5px] tracking-[0.22em] mt-1 opacity-75">GRADE</div>
        </div>
      </div>

      <div className="mt-4" style={at(160)}>
        <div className="font-mono text-[10px] tracking-[0.22em] text-gold mb-1.5">{'—'} FEEDBACK</div>
        <p className="text-[14px] leading-[1.6] text-ink/85">{RESULT.summary}</p>
      </div>

      <div className="mt-4" style={at(300)}>
        <div className="font-mono text-[9.5px] tracking-[0.22em] text-[#1F6F3D] mb-1.5">{'—'} WHAT WENT WELL</div>
        <ul className="space-y-1 text-[13px] leading-[1.5] text-ink/85">
          {RESULT.strengths.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#1F6F3D] shrink-0 leading-[1.5]">+</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4" style={at(440)}>
        <div className="font-mono text-[9.5px] tracking-[0.22em] text-[#9C2E2E] mb-1.5">{'—'} WHAT TO FIX</div>
        <ul className="space-y-1 text-[13px] leading-[1.5] text-ink/85">
          {RESULT.fixes.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#9C2E2E] shrink-0 leading-[1.5]">{'−'}</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
