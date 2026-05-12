'use client';

import { useState } from 'react';
import { formatApiError, type ApiErrorShape } from '@/lib/observability/api-client';

type Status = 'idle' | 'loading' | 'error';

export function ManagePlanButton() {
  const [status, setStatus] = useState<Status>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setStatus('loading');
    setMsg(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setStatus('error');
        const reqId = res.headers.get('x-request-id');
        const baseMessage =
          (data?.message as string | undefined) ??
          (res.status === 503
            ? 'Plan management not available yet. Try again later.'
            : 'Could not open the customer portal.');
        const shape: ApiErrorShape = { status: res.status, message: baseMessage, requestId: reqId, raw: data };
        setMsg(formatApiError(shape));
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setStatus('error');
      setMsg('Network error. Try again.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'loading'}
        className="bg-[#11161E] text-[#FBF7EE] font-medium tracking-[0.05em] px-6 py-3 rounded-sm hover:bg-[#1F2530] transition-colors text-[12px] uppercase disabled:opacity-50 disabled:cursor-not-allowed self-start"
      >
        {status === 'loading' ? 'Openingâ¦' : 'Manage plan'}
      </button>
      {status === 'error' && msg && (
        <p className="text-[11px] text-[#9C2E2E] tracking-[0.04em]">{msg}</p>
      )}
    </div>
  );
}

export function UpgradeButton() {
  const [status, setStatus] = useState<Status>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setStatus('loading');
    setMsg(null);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setStatus('error');
        const reqId = res.headers.get('x-request-id');
        const baseMessage =
          (data?.message as string | undefined) ??
          (res.status === 503
            ? 'Checkout not available yet. Try again soon.'
            : 'Could not start checkout.');
        const shape: ApiErrorShape = { status: res.status, message: baseMessage, requestId: reqId, raw: data };
        setMsg(formatApiError(shape));
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setStatus('error');
      setMsg('Network error. Try again.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'loading'}
        className="bg-[#B88736] text-[#FBF7EE] font-medium tracking-[0.05em] px-6 py-3 rounded-sm hover:bg-[#9C6F1E] transition-colors text-[12px] uppercase disabled:opacity-50 disabled:cursor-not-allowed self-start"
      >
        {status === 'loading' ? 'Loadingâ¦' : 'Upgrade â $12.99 / mo'}
      </button>
      {status === 'error' && msg && (
        <p className="text-[11px] text-[#9C2E2E] tracking-[0.04em]">{msg}</p>
      )}
    </div>
  );
}
