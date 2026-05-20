'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'error';

export function CheckoutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
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
        const message =
          (data?.message as string | undefined) ??
          (res.status === 503
            ? 'Checkout is not configured yet. Please try again later.'
            : 'Could not open checkout. Please try again.');
        setMsg(message);
        return;
      }
      window.location.href = data.url as string;
    } catch (err) {
      setStatus('error');
      setMsg(err instanceof Error ? err.message : 'Network error');
    }
  }

  const disabled = status === 'loading';

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={
          className ??
          'inline-flex items-center gap-1.5 bg-ink text-paper text-[13.5px] px-5 py-2.5 rounded-full hover:bg-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
        }
      >
        {status === 'loading' ? 'Opening checkout…' : (children ?? (<>Get HARDO <span aria-hidden>{'→'}</span></>))}
      </button>
      {status === 'error' && msg ? (
        <span role="alert" className="text-[12.5px] text-red-700">
          {msg}
        </span>
      ) : null}
    </span>
  );
}
