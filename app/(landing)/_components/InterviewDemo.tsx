'use client';

import { useEffect, useState } from 'react';

/* A self-running demo of one interview *block* for the hero. Plays a full,
   unhurried pass at the real product's depth — one question plus two
   follow-ups (the normal max), each asked → answered by voice → transcribed
   → graded — then settles on the block result the way the real summary
   renders it: a grade, a short read, what went well / what to fix, and the
   follow-up depth you held. Reuses the landing voice-card (.vcard) look.
   Honours prefers-reduced-motion by showing the result statically. */

const BLOCK = { n: '02', name: 'Valuation', level: 'Analyst' };
const MAX_FOLLOWUPS = 2; // matches the product's NORMAL_MAX_FOLLOWUPS

type Turn = { kind: 'Question' | 'Follow-up'; q: string; a: string };
const TURNS: Turn[] = [
  {
    kind: 'Question',
    q: "Walk me through how you'd value a pre-revenue biotech with one Phase II asset.",
    a: 'Risk-adjusted NPV — build the peak-sales curve, then weight it by probability of success at each phase.',
  },
  {
    kind: 'Follow-up',
    q: 'What discount rate would you put on those cash flows, and why?',
    a: "Given the binary clinical risk, 12–15% — well above a mature pharma.",
  },
  {
    kind: 'Follow-up',
    q: 'And how would you sanity-check that number?',
    a: 'Cross-check against recent comparable deals — EV per pipeline asset, adjusted for stage.',
  },
];

/* Block result — kept visual and scannable: a grade, a one-line verdict,
   one win + one fix, and the follow-up depth held. */
const RESULT = {
  grade: 'A',
  verdict: 'Strong framework — held through both follow-ups.',
  win: 'Risk-adjusted NPV, weighted by phase.',
  fix: 'Build the 12–15% from the ground up.',
  progress: 'Q 02 / 12',
};

/* Answer key — revealed after the block is graded: what a strong answer had to
   cover, plus a model answer written to the bar. Mirrors the product summary's
   "What a strong answer covers" + "Model answer" reveal. */
const ANSWER_KEY = {
  covers: [
    'Risk-adjusted NPV — peak sales weighted by phase probability.',
    'Discount rate set to the binary clinical risk, not a mature-pharma rate.',
    'Cross-checked against comparable deal value per pipeline asset.',
  ],
  model:
    'Build an rNPV: project peak sales, probability-weight by phase, discount at 12–15% for clinical risk, then sanity-check against recent comparable transactions.',
};

type Sub = 'ask' | 'rec' | 'tx';
type Step =
  | { stage: 'turn'; turn: number; sub: Sub }
  | { stage: 'grading' }
  | { stage: 'result' }
  | { stage: 'answer' };

const STEPS: Step[] = [
  { stage: 'turn', turn: 0, sub: 'ask' },
  { stage: 'turn', turn: 0, sub: 'rec' },
  { stage: 'turn', turn: 0, sub: 'tx' },
  { stage: 'turn', turn: 1, sub: 'ask' },
  { stage: 'turn', turn: 1, sub: 'rec' },
  { stage: 'turn', turn: 1, sub: 'tx' },
  { stage: 'turn', turn: 2, sub: 'ask' },
  { stage: 'turn', turn: 2, sub: 'rec' },
  { stage: 'turn', turn: 2, sub: 'tx' },
  { stage: 'grading' },
  { stage: 'result' },
  { stage: 'answer' },
];
// Unhurried pacing — each part gets time to read before it moves on.
const DUR = [2300, 2200, 3200, 1900, 2000, 2900, 1900, 2000, 2900, 1900, 7000, 6000];

// Smooth, gentle enter used across the demo.
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
function enter(ms = 620, delay = 0): React.CSSProperties {
  return { animation: `fade-rise ${ms}ms ${EASE} ${delay}ms both` };
}

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

function turnLabel(i: number): string {
  return i === 0 ? 'Question' : `Follow-up ${i}`;
}

function tab(step: Step): { t: string; cls: string; dot: boolean } {
  if (step.stage === 'grading') return { t: 'Grading', cls: 'iv-card__tab--thinking', dot: true };
  if (step.stage === 'result') return { t: 'Block graded', cls: 'iv-card__tab--review', dot: false };
  if (step.stage === 'answer') return { t: 'Answer key', cls: 'iv-card__tab--review', dot: false };
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

  // Turns fully done (collapsed above the active area).
  const doneTurns = step.stage === 'turn' ? step.turn : TURNS.length;

  return (
    <div className="vcard !rotate-0" style={{ minHeight: 392 }}>
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
              className="inline-block w-1.5 h-1.5 rounded-full transition-colors duration-700"
              style={{ background: i < doneTurns ? 'var(--gold)' : 'rgba(14,30,54,0.18)' }}
            />
          ))}
          <span className="ml-1.5">{BLOCK.level}</span>
        </span>
      </div>

      {step.stage === 'result' ? (
        <BlockResult reduced={reduced} />
      ) : step.stage === 'answer' ? (
        <AnswerKey reduced={reduced} />
      ) : (
        <div className="mt-4">
          {/* completed turns, collapsed */}
          {TURNS.slice(0, doneTurns).map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-line/70" style={enter(520)}>
              <span className="mt-0.5 text-gold text-[12px] leading-none" aria-hidden>{'✓'}</span>
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">{turnLabel(i)}</div>
                <div className="text-[12.5px] text-ink/70 leading-snug truncate">{t.q}</div>
              </div>
            </div>
          ))}

          {/* active turn */}
          {step.stage === 'turn' && <ActiveTurn step={step} elapsed={elapsed} />}

          {/* grading */}
          {step.stage === 'grading' && (
            <div className="mt-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted" style={enter()}>
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
  const qChars = step.sub === 'ask' ? Math.floor(elapsed / 26) : t.q.length;
  const aChars = step.sub === 'tx' ? Math.floor(elapsed / 28) : 0;
  const recSec = step.sub === 'rec' ? Math.floor(elapsed / 1000) : 0;

  // Keyed on the turn only — it stays mounted across ask/record/transcribe,
  // so only the meter or transcript fades in. Smoother than remounting.
  return (
    <div key={step.turn} className="mt-3" style={enter()}>
      {isFollow && (
        <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold mb-1.5">
          Follow-up {step.turn} {'·'} of {MAX_FOLLOWUPS}
        </div>
      )}
      <p className={isFollow ? 'font-serif italic text-[19px] leading-snug text-ink/90' : 'vcard__question !mt-0 !mb-0'}>
        {t.q.slice(0, qChars)}
        {step.sub === 'ask' && qChars < t.q.length ? <span className="vcard__caret" aria-hidden /> : null}
      </p>

      {step.sub === 'rec' && (
        <div className="vcard__meter mt-5" style={enter()}>
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
        <div style={enter()}>
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
  const at = (ms: number): React.CSSProperties => (reduced ? {} : enter(620, ms));

  return (
    <div className="mt-5">
      {/* hero: the grade carries the result, with a one-line verdict */}
      <div className="flex items-center gap-4 border-b border-line pb-5" style={at(40)}>
        <div className={`shrink-0 border ${gradeTone(RESULT.grade)} w-[68px] h-[68px] flex items-center justify-center ${reduced ? '' : 'rm-grade-pop'}`}>
          <span className="font-serif text-[38px] leading-none">{RESULT.grade}</span>
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Block complete {'·'} {BLOCK.name}</div>
          <div className="mt-1.5 font-serif text-[18px] leading-snug text-ink">{RESULT.verdict}</div>
        </div>
      </div>

      {/* one win, one fix — short, tagged, scannable */}
      <div className="mt-5 space-y-3" style={at(220)}>
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-11 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#1F6F3D] border border-[#1F6F3D]/30 bg-[#1F6F3D]/8 py-1 rounded-sm">Win</span>
          <span className="text-[13.5px] text-ink/85">{RESULT.win}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-11 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#9C2E2E] border border-[#9C2E2E]/30 bg-[#9C2E2E]/8 py-1 rounded-sm">Fix</span>
          <span className="text-[13.5px] text-ink/85">{RESULT.fix}</span>
        </div>
      </div>

      {/* follow-up depth — a real measured axis, shown as a chart */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5" style={at(380)}>
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">Follow-up depth</div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: MAX_FOLLOWUPS }).map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--gold)' }} />
            ))}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/65">held to {MAX_FOLLOWUPS} / {MAX_FOLLOWUPS}</span>
        </div>
      </div>

      <div className="mt-3.5 border-t border-line pt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted" style={at(500)}>
        <span>Graded to the director bar</span>
        <span>{RESULT.progress}</span>
      </div>
    </div>
  );
}

function AnswerKey({ reduced }: { reduced: boolean }) {
  // Stagger the sections in unless reduced-motion is requested.
  const at = (ms: number): React.CSSProperties => (reduced ? {} : enter(620, ms));

  return (
    <div className="mt-5">
      {/* the answer key arrives once the block is graded */}
      <div className="flex items-center justify-between border-b border-line pb-3" style={at(40)}>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">After the grade {'·'} {BLOCK.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Answer key</span>
      </div>

      {/* what a strong answer covers */}
      <div className="mt-4" style={at(200)}>
        <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">What a strong answer covers</div>
        <ul className="mt-2.5 space-y-2">
          {ANSWER_KEY.covers.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink/85">
              <span className="mt-0.5 shrink-0 text-gold text-[12px] leading-none" aria-hidden>{'✓'}</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* the model answer, written to the bar */}
      <div className="mt-5 border-t border-line pt-4" style={at(360)}>
        <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold">Model answer</div>
        <p
          className="mt-2 font-serif italic text-[14.5px] leading-snug text-ink/80 pl-3.5"
          style={{ borderLeft: '2px solid var(--gold)' }}
        >
          {ANSWER_KEY.model}
        </p>
      </div>
    </div>
  );
}
