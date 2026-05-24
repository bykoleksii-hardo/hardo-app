'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatApiError, type ApiErrorShape } from '@/lib/observability/api-client';

type Level = 'intern' | 'analyst' | 'associate';
type InputMode = 'text' | 'voice';

type Props = {
  level: Level;
  inputMode: InputMode;
};

export default function NextStepsCard({ level, inputMode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAgain() {
    if (loading || isPending) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, input_mode: inputMode }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (res.status === 403 && (j?.reason === 'free_limit_reached' || j?.reason === 'level_locked')) {
        router.push('/upgrade');
        return;
      }
      if (!res.ok || !j?.interview_id) {
        const reqId = res.headers.get('x-request-id');
        const shape: ApiErrorShape = { status: res.status, message: j?.error || 'Failed to start interview', requestId: reqId, raw: j };
        setError(formatApiError(shape));
        setLoading(false);
        return;
      }
      startTransition(() => {
        router.push('/interview/' + j.interview_id);
      });
    } catch (e: any) {
      setError(formatApiError({ status: 0, message: e?.message || 'Network error' } as ApiErrorShape));
      setLoading(false);
    }
  }

  const busy = loading || isPending;
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <section className="mt-12">
      <div className="text-[11px] tracking-[0.22em] text-[#9C2E2E] mb-2">WHAT&apos;S NEXT</div>
      <div className="border border-[#11161E]/10 bg-[#F4ECD8]/50 px-6 py-7 md:px-8 md:py-8">
        <div className="text-[20px] md:text-[22px] leading-snug text-[#11161E] font-medium mb-1">
          Ready for another rep?
        </div>
        <p className="text-[14px] text-[#11161E]/70 leading-relaxed mb-6 max-w-[60ch]">
          Stay sharp. Run the same setup again to drill the level, or step into a different difficulty band.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={runAgain}
            disabled={busy}
            className="inline-flex items-center justify-center bg-[#B88736] text-[#FBF7EE] tracking-wide px-8 py-3 font-medium hover:bg-[#9F7530] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? 'Starting…' : 'Run another interview —→'}
          </button>
          <Link
            href="/interview/setup"
            className="inline-flex items-center justify-center border border-[#11161E]/30 text-[#11161E] tracking-wide px-8 py-3 font-medium hover:border-[#11161E]/60 hover:bg-[#11161E]/[0.03] transition-colors"
          >
            Try a different level
          </Link>
        </div>

        <div className="text-[11px] text-[#11161E]/50 mt-4 tracking-wide">
          CURRENT SETUP · {levelLabel.toUpperCase()} · {inputMode === 'voice' ? 'VOICE' : 'TEXT'}
        </div>

        {error && (
          <div className="mt-4 text-[13px] text-[#9C2E2E] border border-[#9C2E2E]/30 bg-[#9C2E2E]/5 px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
