'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { VaultQuestionDetail } from '@/lib/vault/queries';

function gradeTone(grade: string | null): string {
  if (!grade) return 'text-muted border-line';
  const g = grade[0];
  if (g === 'A') return 'text-[#3F7A4E] border-[#3F7A4E]/40';
  if (g === 'B') return 'text-[#7A6A2F] border-[#7A6A2F]/40';
  if (g === 'C') return 'text-[#9A6F26] border-[#9A6F26]/40';
  return 'text-[#B4452F] border-[#B4452F]/40';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

  async function startDeepDive() {
    if (starting) return;
    if (!isPaid) {
      router.push('/upgrade');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/question/${detail.id}/start`, { method: 'POST' });
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
    <main className="max-w-[860px] mx-auto px-5 md:px-12 py-10 md:py-14">
      <Link
        href="/vault"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors mb-8"
      >
        {'\u2190'} Question Vault
      </Link>

      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#B88736]">{detail.category}</span>
        {detail.bestGrade && (
          <span className={`font-mono text-[13px] px-2 py-1 border rounded-sm ${gradeTone(detail.bestGrade)}`}>
            Best {detail.bestGrade}
          </span>
        )}
      </div>

      <h1 className="font-serif text-2xl md:text-3xl leading-snug text-ink mb-3">{detail.question}</h1>
      {detail.subtopic && (
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted mb-8">{detail.subtopic}</p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-9">
        <div className="border border-line rounded-sm bg-paper p-4 text-center">
          <p className="font-serif text-2xl text-ink">{detail.attempts}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Attempts</p>
        </div>
        <div className="border border-line rounded-sm bg-paper p-4 text-center">
          <p className="font-serif text-2xl text-ink">{detail.avgScore ?? '\u2014'}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Avg score</p>
        </div>
        <div className="border border-line rounded-sm bg-paper p-4 text-center">
          <p className="font-serif text-2xl text-ink">{detail.deepDiveCount}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Deep dives</p>
        </div>
      </div>

      <div className="border border-[#B88736]/30 bg-[#B88736]/[0.05] rounded-sm p-5 md:p-6 mb-10">
        <h2 className="font-serif text-lg text-ink mb-1">Deep dive this question</h2>
        <p className="text-[13.5px] text-ink-2 leading-relaxed mb-4">
          Run this question on its own with up to five follow-ups, graded the same way as a real round.
          It will not use your free interview.
        </p>
        <button
          type="button"
          onClick={startDeepDive}
          disabled={starting}
          className="inline-flex items-center justify-center bg-ink text-paper font-mono text-[12px] uppercase tracking-[0.16em] px-5 py-2.5 rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {starting ? 'Starting\u2026' : isPaid ? 'Start deep dive' : 'Upgrade to deep dive'}
        </button>
        {!isPaid && (
          <p className="mt-3 text-[12.5px] text-ink-2">
            Deep dives are a paid feature.{' '}
            <Link href="/upgrade" className="text-[#B88736] underline underline-offset-2 hover:text-[#9A6F26]">
              See plans
            </Link>
          </p>
        )}
        {error && <p className="mt-3 text-[12.5px] text-[#B4452F]">{error}</p>}
      </div>

      <h2 className="font-serif text-xl text-ink mb-4">Feedback history</h2>
      {detail.feedback.length === 0 ? (
        <p className="text-muted text-[14px] py-10 text-center border border-line rounded-sm bg-cream/30">
          No graded answers yet. Start a deep dive or meet this question in an interview.
        </p>
      ) : (
        <ul className="space-y-4">
          {detail.feedback.map((f) => (
            <li key={f.stepId} className="border border-line rounded-sm bg-paper p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {f.grade && (
                    <span className={`font-mono text-[11px] px-1.5 py-0.5 border rounded-sm ${gradeTone(f.grade)}`}>
                      {f.grade}
                    </span>
                  )}
                  {f.kind === 'deep_dive' && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#B88736] border border-[#B88736]/40 rounded-sm px-1.5 py-0.5">
                      Deep dive
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10.5px] text-muted">{fmtDate(f.createdAt)}</span>
              </div>
              {f.answer && (
                <p className="text-[13px] text-ink-2 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted block mb-1">Your answer</span>
                  {f.answer}
                </p>
              )}
              {f.feedback && (
                <p className="text-[13.5px] text-ink leading-relaxed whitespace-pre-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B88736] block mb-1">Feedback</span>
                  {f.feedback}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
