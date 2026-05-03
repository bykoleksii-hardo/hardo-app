import { redirect } from 'next/navigation';
import Brand from '@/app/_components/Brand';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ProfileTabs } from './profile-tabs';

export const dynamic = 'force-dynamic';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, preferred_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const displayName =
    (profile?.preferred_name as string | null) ||
    (profile?.first_name as string | null) ||
    (user.email ?? '').split('@')[0];

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-sans">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-12 py-8 border-b border-[#f5efe2]/10">
        <Brand size="sm" href="/" />
        <div className="flex items-center gap-6 text-xs tracking-[0.18em] text-[#f5efe2]/55">
          <Link href="/interview/setup" className="hover:text-[#d4a04a] transition-colors">START INTERVIEW</Link>
          <span className="text-[#f5efe2]/85">{(displayName ?? '').toUpperCase()}</span>
        </div>
      </div>

      <main className="max-w-[1320px] mx-auto px-12 py-12">
        <ProfileTabs />
        {children}
      </main>
    </div>
  );
}
