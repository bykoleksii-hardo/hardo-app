'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { VaultQuestionDetail } from '@/lib/vault/queries';

// Mirrors the listing so a question's grade reads the same on both screens.
function gradeTone(grade: string | null): string {
  if (!grade) return 'text-muted border-line';
  const head = grade[0];
  if (head === 'A') return 'text-[#2F7D4F] border-[#2F7D4F]/45';
  if (head === 'B') return 'text-[#B88736] border-[#B88736]/50';
  if (head === 'C') return 'text-[#9A6F26] border-[#9A6F26]/45';
  return 'text-[#B4452F] border-[#B4452F]/45';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Fixed locale keeps server (Worker) and client output identical, avoiding a hydration mismatch (React #418).
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

type ParsedFeedback = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  howToImprove: string | null;
};

// Mirrors the interview summary view: ai_feedback is stored as a JSON string
// ({ summary, strengths[], weaknesses[], detail.how_to_improve }). Render it
// as readable sections; fall back to the raw text if it is not JSON.
function parseFeedback(raw: string | null): ParsedFeedback | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as {
      summary?: unknown;
      strengths?: unknown;
      weaknesses?: unknown;
      detail?: { how_to_improve?: unknown } | null;
    };
    const detail = j && typeof j === 'object' && j.detail && typeof j.detail === 'object' ? j.detail : null;
    return {
      summary: typeof j.summary === 'string' ? j.summary : '',
      strengths: Array.isArray(j.strengths) ? (j.strengths.filter((x) => typeof x === 'string') as string[]) : [],
      weaknesses: Array.isArray(j.weaknesses) ? (j.weaknesses.filter((x) => typeof x === 'string') as string[]) : [],
      howToImprove: detail && typeof detail.how_to_improve === 'string' ? detail.how_to_improve : null,
    };
  } catch {
    return { summary: raw, strengths: [], weaknesses: [], howToImprove: null };
  }
}

function Stat({ label, value, first }: { label: string; value: number | string; first?: boolean }) {
  return (
    <div className={`px-4 py-5 text-center ${first ? '' : 'border-l border-line'}`}>
      <p className="font-serif text-[26px] font-light leading-none text-ink">{value}</p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
    </div>
  );
}

export function QuestionDetailClient({
  detail,
  isPaid,
}: {
  detail: VaultQuestionDetail;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');

  async function startDeepDive() {
    if (starting) return;
    if (!isPaid) {
      router.push('/upgrade');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/question/${detail.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_mode: inputMode }),
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 403) {
        if (body?.reason === 'upgrade_required') {
          router.push('/upgrade');
          return;
        }
        setError('This question is locked. Encounter it in an interview to unlock it.');
        setStarting(false);
        return;
      }
      if (!res.ok || !body?.interview_id) {
        setError(body?.error ?? 'Could not start the deep dive. Please try again.');
        setStarting(false);
        return;
      }
      router.push(`/interview/${body.interview_id}`);
    } catch {
      setError('Could not start the deep dive. Please try again.');
      setStarting(false);
    }
  }

  return (
    <main className="max-w-[820px] mx-auto px-5 md:px-12 py-10 md:py-16">
      <Link
        href="/vault"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors mb-9"
      >
        <span aria-hidden>{'←'}</span> Question Vault
      </Link>

      <header className="relative overflow-hidden mb-9">
        <div className="bg-orb" aria-hidden style={{ top: '-190px', left: '-130px' }} />
        <div className="relative z-[1]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="eyebrow">{detail.category}</div>
            {detail.bestGrade && (
              <span className={`font-mono text-[12px] px-2.5 py-1 border rounded-[3px] ${gradeTone(detail.bestGrade)}`}>
                Best {detail.bestGrade}
              </span>
            )}
          </div>
          <h1 className="font-serif text-[26px] md:text-[34px] font-light leading-[1.12] tracking-[-0.015em] text-ink">
            {detail.question}
          </h1>
          {detail.subtopic && (
            <p className="mt-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{detail.subtopic}</p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 border border-line rounded-[3px] bg-paper overflow-hidden mb-10">
        <Stat label="Attempts" value={detail.attempts} first />
        <Stat label="Avg score" value={detail.avgScore ?? '—'} />
        <Stat label="Deep dives" value={detail.deepDiveCount} />
      </div>

      <div className="relative border border-gold-line bg-gold-soft rounded-[4px] p-6 md:p-7 mb-12">
        <div className="eyebrow mb-3">Go deeper</div>
        <h2 className="font-serif text-[21px] md:text-[23px] font-light leading-snug text-ink">Deep dive this question</h2>
        <p className="mt-2.5 text-[13.5px] text-ink-2 leading-relaxed max-w-lg">
          Run this question on its own with up to five follow-ups, graded the same way as a real round.
          It will not use your free interview.
        </p>
        {isPaid && (
          <div className="mt-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted block mb-2.5">How will you answer?</span>
            <div className="inline-flex gap-2">
              {(['text', 'voice'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInputMode(m)}
                  aria-pressed={m === inputMode}
                  className="vault-pill"
                >
                  {m === 'text' ? 'Type' : 'Speak'}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[12px] text-ink-2">
              {inputMode === 'voice'
                ? 'Speak your answer out loud — microphone required, transcript is editable.'
                : 'Type your answer — quiet practice, edit before you send.'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={startDeepDive}
          disabled={starting}
          className="mt-6 inline-flex items-center justify-center bg-ink text-paper font-mono text-[12px] uppercase tracking-[0.16em] px-6 py-3 rounded-[3px] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {starting ? 'Starting…' : isPaid ? 'Start deep dive' : 'Upgrade to deep dive'}
        </button>
        {!isPaid && (
          <p className="mt-3.5 text-[12.5px] text-ink-2">
            Deep dives are a paid feature.{' '}
            <Link href="/upgrade" className="text-gold underline underline-offset-2 hover:text-gold-2">
              See plans
            </Link>
          </p>
        )}
        {error && <p className="mt-3 text-[12.5px] text-[#B4452F]">{error}</p>}
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-[21px] font-light text-ink">Feedback history</h2>
        {detail.feedback.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{detail.feedback.length} graded</span>
        )}
      </div>

      {detail.feedback.length === 0 ? (
        <div className="border border-line rounded-[3px] bg-cream/40 py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            No graded answers yet &mdash; start a deep dive, or meet this question in a round.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {detail.feedback.map((f, idx) => {
            const fb = parseFeedback(f.feedback);
            return (
              <li key={f.stepId} className="border border-line rounded-[3px] bg-paper p-5 transition-colors hover:border-gold-line">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      Attempt {detail.feedback.length - idx}
                    </span>
                    {f.kind === 'deep_dive' && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gold border border-gold-line rounded-[3px] px-1.5 py-0.5">
                        Deep dive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {f.grade && (
                      <span className={`font-mono text-[11px] px-1.5 py-0.5 border rounded-[3px] ${gradeTone(f.grade)}`}>
                        {f.grade}
                      </span>
                    )}
                    <span className="font-mono text-[10.5px] text-muted whitespace-nowrap">{fmtDate(f.createdAt)}</span>
                  </div>
                </div>
                {f.answer && (
                  <div className="mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1">Your answer</span>
                    <p className="text-[13px] text-ink-2 leading-relaxed whitespace-pre-wrap line-clamp-4">{f.answer}</p>
                  </div>
                )}
                {fb && (fb.summary || fb.strengths.length > 0 || fb.weaknesses.length > 0 || fb.howToImprove) && (
                  <div className="border-t border-line/70 pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold block mb-1.5">Feedback</span>
                    {fb.summary && <p className="text-[13.5px] text-ink leading-relaxed mb-2">{fb.summary}</p>}
                    {fb.strengths.length > 0 && (
                      <ul className="mb-2 space-y-0.5">
                        {fb.strengths.map((x, i) => (
                          <li key={i} className="text-[13px] text-[#2F7D4F] leading-relaxed pl-3 relative before:content-['+'] before:absolute before:left-0">{x}</li>
                        ))}
                      </ul>
                    )}
                    {fb.weaknesses.length > 0 && (
                      <ul className="mb-2 space-y-0.5">
                        {fb.weaknesses.map((x, i) => (
                          <li key={i} className="text-[13px] text-[#B4452F] leading-relaxed pl-3 relative before:content-['\2212'] before:absolute before:left-0">{x}</li>
                        ))}
                      </ul>
                    )}
                    {fb.howToImprove && (
                      <p className="text-[12.5px] text-ink-2 leading-relaxed italic">{fb.howToImprove}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
