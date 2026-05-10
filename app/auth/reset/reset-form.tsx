'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

interface Props {
  email: string;
}

export default function ResetForm({ email }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pw.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pw !== pw2) {
      setError('Passwords don\u2019t match.');
      return;
    }

    setLoading(true);
    const { error: e1 } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (e1) {
      setError(e1.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 1200);
  }

  if (done) {
    return (
      <div className="border border-[#B88736]/40 rounded-sm p-6 bg-[#F2ECDF]/40">
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#B88736] mb-2">{'\u2014 DONE'}</div>
        <p className="font-serif text-xl leading-snug">Password updated. Taking you in\u2026</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="new-pw" className="text-[10px] tracking-[0.2em] uppercase text-[#11161E]/60">New password</label>
          <button type="button" onClick={() => setShow(s => !s)} className="text-[10px] tracking-[0.2em] uppercase text-[#11161E]/50 hover:text-[#B88736]">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          id="new-pw"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="new-pw-2" className="block text-[10px] tracking-[0.2em] uppercase text-[#11161E]/60 mb-1.5">Confirm password</label>
        <input
          id="new-pw-2"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
          placeholder="Re-enter your password"
        />
      </div>

      {error && (
        <div className="border border-[#9C2E2E]/30 bg-[#9C2E2E]/5 text-[13px] text-[#9C2E2E] px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#B88736] text-[#FBF7EE] font-medium tracking-[0.05em] py-3.5 rounded-sm hover:bg-[#9C6F1E] transition-colors disabled:opacity-60"
      >
        {loading ? 'Saving\u2026' : 'Save new password \u2192'}
      </button>
    </form>
  );
}
