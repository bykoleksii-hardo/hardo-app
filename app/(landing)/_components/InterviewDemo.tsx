'use client';

import { useEffect, useState } from 'react';

/* A self-running demo of one interview *block* for the hero. Plays a full
   pass — question → voice answer → transcript → follow-up → voice answer →
   transcript → grading — then shows the block grade with a short written
   note, the way a real interviewer closes out a block. Reuses the landing
   voice-card (.vcard) look. Honours prefers-reduced-motion by showing the
   final block result statically. */

const BLOCK = { n: '02', name: 'Valuation', level: 'Analyst' };

type Turn = { kind: 'Question' | 'Follow-up'; q: string; a: string };
const TURNS: Turn[] = [
  {
    kind: 'Question',
    q: "Walk me through how you'd value a pre-revenue biotech with one Phase II asset.",
    a: "I'd lean on a risk-adjusted NPV — build a peak-sales curve, then weight it by probability of success by phase…",
  },
  {
    kind: 'Follow-up',
    q: 'Good. What discount rate would you use, and why?',
    a: "Given the binary clinical risk, I'd push to 12–15% — well above a mature pharma, since these cash flows are far from certain.",
  },
];

// Block result, shown like a real interviewer's end-of-block read.
const RESULT = {
  grade: 'A−',
  note: 'Clean risk-adjusted framework, and you reached for probability-weighting without being prompted. Push harder on why 12–15% over a built-up CAPM and this is a clear A.',
  criteria: [
    { label: 'Structure', grade: 'A−' },
    { label: 'Numbers', grade: 'B+' },
    { label: 'Pushback', grade: 'B+' },
  ],
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
const DUR = [1900, 2000, 2700, 1700, 1900, 2600, 1300, 5200];

function gradeColor(g: string): string {
  const c = (g || '')[0];
  if (c === 'A') return 'text-[#1F6F3D]';
  if (c === 'B') return 'text-[#3F7A4A]';
  if (c === 'C') return 'text-[#A85A1F]';
  return 'text-ink';
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

  // How many turns are fully done (collapsed above the active area).
  const doneTurns =
    step.stage === 'turn' ? step.turn : TURNS.length;

  const turnsDone = reduced ? TURNS.length : doneTurns;

  return (
    <div className="vcard !rotate-0" style={{ minHeight: 468 }}>
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
              className={`inline-block w-1.5 h-1.5 rounded-full ${i < turnsDone ? 'bg-gold' : 'bg-ink/20'}`}
            />
          ))}
          <span className="ml-1.5">{BLOCK.level}</span>
        </span>
      </div>

      {step.stage === 'result' ? (
        <BlockResult />
      ) : (
        <div className="mt-4">
          {/* completed turns, collapsed */}
          {TURNS.slice(0, doneTurns).map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 border-b border-line/70">
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
            <div className="mt-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span className="iv-card__tab-dot bg-ink/50" aria-hidden />
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
  const qChars = step.sub === 'ask' ? Math.floor(elapsed / 22) : t.q.length;
  const aChars = step.sub === 'tx' ? Math.floor(elapsed / 24) : 0;
  const recSec = step.sub === 'rec' ? Math.floor(elapsed / 1000) : 0;

  return (
    <div key={`${step.turn}-${step.sub}`} className="anim-fade mt-3">
      {isFollow && (
        <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold mb-1.5">Follow-up</div>
      )}
      <p className={isFollow ? 'font-serif italic text-[19px] leading-snug text-ink/90' : 'vcard__question !mt-0 !mb-0'}>
        {t.q.slice(0, qChars)}
        {step.sub === 'ask' && qChars < t.q.length ? <span className="vcard__caret" aria-hidden /> : null}
      </p>

      {step.sub === 'rec' && (
        <div className="vcard__meter mt-5">
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
        <>
          <div className="vcard__transcript-label mt-5">Whisper {'·'} transcript</div>
          <div className="vcard__transcript">
            {t.a.slice(0, aChars)}
            {aChars < t.a.length ? <span className="vcard__caret" aria-hidden /> : null}
          </div>
        </>
      )}
    </div>
  );
}

function BlockResult() {
  return (
    <div className="anim-fade mt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Block complete {'·'} {BLOCK.name}</div>
          <div className="mt-1 font-serif text-[22px] font-medium">Strong block</div>
        </div>
        <div className={`font-serif text-[52px] font-light leading-none rm-grade-pop ${gradeColor(RESULT.grade)}`}>
          {RESULT.grade}
        </div>
      </div>

      <p
        className="mt-4 border-l-2 border-gold/60 pl-4 font-serif text-[15px] italic leading-relaxed text-ink/85"
        style={{ animation: 'fade-rise 460ms cubic-bezier(0.16,1,0.3,1) 160ms both' }}
      >
        {RESULT.note}
      </p>

      <div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
        {RESULT.criteria.map((c, i) => (
          <div
            key={c.label}
            className="px-3 first:pl-0"
            style={{ animation: `rise-in 460ms cubic-bezier(0.16,1,0.3,1) ${240 + i * 120}ms both` }}
          >
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">{c.label}</div>
            <div className={`mt-1 font-serif text-[22px] font-medium leading-none ${gradeColor(c.grade)}`}>{c.grade}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-widest text-muted flex items-center justify-between">
        <span>Letter grades stay hidden in-session</span>
        <span>Block 2 / 6</span>
      </div>
    </div>
  );
}
