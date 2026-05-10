'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'ok' | 'err';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading' || status === 'ok') return;
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setErrMsg('Enter a valid email');
      setStatus('err');
      return;
    }
    setStatus('loading');
    setErrMsg('');
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErrMsg(j?.error === 'invalid_email' ? 'Enter a valid email' : 'Try again later');
        setStatus('err');
        return;
      }
      setStatus('ok');
    } catch {
      setErrMsg('Network error');
      setStatus('err');
    }
  }

  if (status === 'ok') {
    return (
      <div className="mt-6 max-w-sm">
        <div className="border border-line rounded-full bg-paper px-4 py-2.5 text-[13px] text-ink">
          Thanks. We&rsquo;ll be in touch.
        </div>
        <p className="mt-2 text-[11px] text-muted font-mono uppercase tracking-widest">
          You can unsubscribe any time.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-sm">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border border-line rounded-full bg-paper pl-4 pr-1 py-1"
        noValidate
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
          aria-label="Email for product updates"
          autoComplete="email"
          className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted outline-none py-1.5"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-ink text-paper text-[12px] px-3.5 py-1.5 rounded-full hover:bg-navy transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending…' : 'Notify me'}
        </button>
      </form>
      <p className="mt-2 text-[11px] text-muted font-mono uppercase tracking-widest">
        {status === 'err' && errMsg ? errMsg : 'No spam. New rooms and write-ups only.'}
      </p>
    </div>
  );
}
