import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { SetupClient } from './setup-client';
import LandingHeader from '@/app/(landing)/_components/Header';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const viewer = await getViewerPlan();
  const role = await getUserRole();
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';

  return (
    <>
      <LandingHeader signedIn isAdmin={isAdmin} isPaid={isPaid} onLanding />
      <SetupClient userEmail={user.email ?? ''} />
    </>
  );
}
