'use client';

import { useEffect, useState } from 'react';

/* A self-running demo of an interview session for the hero. Cycles through the
   real phases — question → record → transcribe → follow-up → grading → scorecard
   — then loops. Reuses the landing voice-card (.vcard) look. Honours
   prefers-reduced-motion by showing the final scorecard statically. */

type Phase = 'ask' | 'record' | 'transcribe' | 'followup' | 'grading' | 'scorecard';
const ORDER: Phase[] = ['ask', 'record', 'transcribe', 'followup', 'grading', 'scorecard'];
const DUR: Record<Phase, number> = { ask: 2200, record: 3000, transcribe: 3600, followup: 2600, grading: 1500, scorecard: 4600 };

const QUESTION = "Walk me through how you'd value a pre-revenue biotech with one Phase II asset.";
const TRANSCRIPT = "I'd lean on a risk-adjusted NPV — build a peak-sales curve, then weight it by probability of success by phase…";
const FOLLOWUP = 'Good. What discount rate would you use, and why?';

const ROWS: Array<{ name: string; grade: string; note: string }> = [
  { name: 'Accounting', grade: 'B+', note: 'Solid mechanics. Missed a working-capital check.' },
  { name: 'Valuation', grade: 'A−', note: 'Clean DCF. Strong on terminal value.' },
  { name: 'Behavioral', grade: 'A−', note: 'Answer-first. Held up under 3 follow-ups.' },
];

function gradeColor(g: string): string {
  const c = (g || '')[0];
  if (c === 'A') return 'text-[#1F6F3D]';
  if (c === 'B') return 'text-[#3F7A4A]';
  if (c === 'C') return 'text-[#A85A1F]';
  return 'text-ink';
}

const TAB: Record<Phase, { t: string; cls: string; dot: boolean }> = {
  ask:        { t: 'Question',     cls: 'iv-card__tab--ready',        dot: false },
  record:     { t: 'Recording',    cls: 'iv-card__tab--recording',    dot: true },
  transcribe: { t: 'Transcribing', cls: 'iv-card__tab--transcribing', dot: true },
  followup:   { t: 'Follow-up',    cls: 'iv-card__tab--ready',        dot: false },
  grading:    { t: 'Grading',      cls: 'iv-card__tab--thinking',     dot: true },
  scorecard:  { t: 'Graded',       cls: 'iv-card__tab--review',       dot: false },
};

const WAVE = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 15, 23, 11, 19, 27, 17, 25, 13, 21, 29, 14, 18, 22];

export default function InterviewDemo() {
  const [phase, setPhase] = useState<Phase>('ask');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setPhase('scorecard'); return; }

    let raf = 0;
    let idx = 0;
    let t0 = performance.now();
    const tick = (now: number) => {
      const e = now - t0;
      const cur = ORDER[idx];
      if (e >= DUR[cur]) {
        idx = (idx + 1) % ORDER.length;
        t0 = now;
        setPhase(ORDER[idx]);
        setElapsed(0);
      } else {
        setElapsed(e);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isCard = phase === 'scorecard';
  const qChars = phase === 'ask' ? Math.floor(elapsed / 22) : QUESTION.length;
  const tChars =
    phase === 'transcribe' ? Math.floor(elapsed / 26)
    : phase === 'followup' || phase === 'grading' ? TRANSCRIPT.length
    : 0;
  const recSec = phase === 'record' ? Math.floor(elapsed / 1000) : 0;
  const showMeter = phase === 'record';
  const showTranscript = phase === 'transcribe' || phase === 'followup' || phase === 'grading';
  const showFollowup = phase === 'followup' || phase === 'grading';
  const tab = TAB[phase];

  return (
    <div className="vcard !rotate-0" style={{ minHeight: 452 }}>
      <div
        className={`vcard__tab ${tab.cls}`}
        role="status"
        aria-live="off"
        style={{ width: 'auto', minWidth: 84, padding: '0 16px' }}
      >
        {tab.dot ? <span className="iv-card__tab-dot" aria-hidden /> : null}
        <span>{tab.t}</span>
      </div>

      {!isCard ? (
        <div key={phase} className="anim-fade">
          <div className="vcard__head">
            <span>Q 04 / 12 {'·'} Analyst</span>
            <span className={phase === 'record' ? 'vcard__rec' : ''}>{phase === 'record' ? 'Recording' : 'Voice'}</span>
          </div>

          <p className="vcard__question">
            {qText(qChars)}
            {phase === 'ask' && qChars < QUESTION.length ? <span className="vcard__caret" aria-hidden /> : null}
          </p>

          {showMeter && (
            <div className="vcard__meter">
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
                <b>0:{String(recSec).padStart(2, '0')}</b> <span className="cap">/ 2:00 cap</span>
              </div>
            </div>
          )}

          {showTranscript && (
            <>
              <div className="vcard__transcript-label">Whisper {'·'} transcript</div>
              <div className="vcard__transcript">
                {TRANSCRIPT.slice(0, tChars)}
                {phase === 'transcribe' && tChars < TRANSCRIPT.length ? <span className="vcard__caret" aria-hidden /> : null}
              </div>
            </>
          )}

          {showFollowup && (
            <div className="mt-5 border-l-2 border-gold/60 pl-4 anim-fade">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold mb-1">Follow-up</div>
              <p className="font-serif italic text-[17px] leading-snug text-ink/90">{FOLLOWUP}</p>
            </div>
          )}

          {phase === 'grading' && (
            <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Grading the block{'…'}
            </div>
          )}
        </div>
      ) : (
        <div key="scorecard" className="anim-fade">
          <div className="vcard__head">
            <span>Scorecard {'·'} Analyst</span>
            <span>38m {'·'} Voice</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Final recommendation</div>
              <div className="mt-1 font-serif text-[22px] font-medium">Leaning hire</div>
            </div>
            <div className="font-serif text-[52px] font-light leading-none text-ink rm-grade-pop">A{'−'}</div>
          </div>

          <div className="mt-5 grid divide-y divide-line border-t border-line">
            {ROWS.map((r, i) => (
              <div
                key={r.name}
                className="py-3 grid grid-cols-[104px_40px_1fr] items-start gap-3"
                style={{ animation: `rise-in 480ms cubic-bezier(0.16,1,0.3,1) ${120 + i * 140}ms both` }}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted pt-1">{r.name}</div>
                <div className={`font-serif text-[20px] font-medium leading-none ${gradeColor(r.grade)}`}>{r.grade}</div>
                <div className="text-[12.5px] text-ink/70 leading-snug">{r.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-3 font-mono text-[10.5px] uppercase tracking-widest text-muted flex items-center justify-between">
            <span>Follow-up depth {'·'} 3.4 / 5</span>
            <span>Six-axis radar</span>
          </div>
        </div>
      )}
    </div>
  );
}

function qText(n: number) {
  return QUESTION.slice(0, n);
}
