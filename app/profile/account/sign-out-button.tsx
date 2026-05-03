'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type Props = {
  variant?: 'text' | 'button';
};

export function SignOutButton({ variant = 'button' }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-ink-2/70 hover:text-gold transition-colors tracking-[0.18em] disabled:opacity-60"
      >
        {loading ? 'SIGNING OUT\u2026' : 'SIGN OUT'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="border border-[#11161E]/30 text-[#11161E] tracking-[0.05em] px-6 py-3 rounded-sm hover:border-[#B0413E] hover:text-[#B0413E] transition-colors disabled:opacity-60"
    >
      {loading ? 'Signing out\u2026' : 'Sign out'}
    </button>
  );
}
