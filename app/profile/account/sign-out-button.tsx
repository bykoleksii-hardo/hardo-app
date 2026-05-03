'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      }}
      disabled={loading}
      className="border border-[#11161E]/30 text-[#11161E] tracking-[0.05em] px-6 py-3 rounded-sm hover:border-[#e89292] hover:text-[#e89292] transition-colors disabled:opacity-60"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
