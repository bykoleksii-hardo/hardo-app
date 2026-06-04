import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ProfileTabs } from './profile-tabs';
import LandingHeader from '@/app/(landing)/_components/Header';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const viewer = await getViewerPlan();
  const role = await getUserRole();
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <LandingHeader signedIn isAdmin={isAdmin} isPaid={isPaid} onLanding />

      <main className="max-w-[1320px] mx-auto px-5 md:px-12 py-8 md:py-12">
        <ProfileTabs />
        {children}
      </main>
    </div>
  );
}
