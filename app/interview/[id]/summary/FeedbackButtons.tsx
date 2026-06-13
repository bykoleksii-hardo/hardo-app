'use client';

import { useState, useTransition } from 'react';
import { parseApiError, formatApiError } from '@/lib/observability';

type Rating = -1 | 0 | 1;

type Props = {
  stepId: string;
  initialRating: Rating;
};

export default function FeedbackButtons({ stepId, initialRating }: Props) {
  const [rating, setRating] = useState<Rating>(initialRating);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function vote(next: Exclude<Rating, 0>) {
    setError(null);
    // Toggle off if clicking the already-active button.
    const target: Rating = rating === next ? 0 : next;
    const prev = rating;
    setRating(target); // optimistic

    startTransition(async () => {
      try {
        const res = await fetch('/api/interview/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step_id: stepId, rating: target }),
        });
        if (!res.ok) {
          const err = await parseApiError(res);
          throw err;
        }
        await res.json().catch(() => null);
      } catch (e: any) {
        setRating(prev); // revert
        setError(formatApiError(e));
      }
    });
  }

  const upActive = rating === 1;
  const downActive = rating === -1;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] tracking-[0.22em] text-ink/45 mr-1">
        DID YOU LIKE THIS QUESTION BLOCK?
      </span>
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={pending}
        aria-pressed={upActive}
        aria-label="Like this question"
        title="Like this question"
        className={
          'h-7 w-7 flex items-center justify-center border text-[14px] transition-colors ' +
          (upActive
            ? 'border-[#1F6F3D] text-[#1F6F3D] bg-[#1F6F3D]/10'
            : 'border-ink/20 text-ink/55 hover:border-[#1F6F3D] hover:text-[#1F6F3D]') +
          (pending ? ' opacity-60 cursor-wait' : '')
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={upActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l4.34-7.66A1.93 1.93 0 0 1 13 2a2.88 2.88 0 0 1 2 5z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={pending}
        aria-pressed={downActive}
        aria-label="Dislike this question"
        title="Dislike this question"
        className={
          'h-7 w-7 flex items-center justify-center border text-[14px] transition-colors ' +
          (downActive
            ? 'border-[#9C2E2E] text-[#9C2E2E] bg-[#9C2E2E]/10'
            : 'border-ink/20 text-ink/55 hover:border-[#9C2E2E] hover:text-[#9C2E2E]') +
          (pending ? ' opacity-60 cursor-wait' : '')
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={downActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-4.34 7.66A1.93 1.93 0 0 1 11 22a2.88 2.88 0 0 1-2-5z" />
        </svg>
      </button>
      {error && <span className="text-[11px] text-[#9C2E2E] ml-2">{error}</span>}
    </div>
  );
}
