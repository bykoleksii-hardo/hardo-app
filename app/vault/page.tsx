import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import LandingHeader from '@/app/(landing)/_components/Header';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';
import { getVaultData } from '@/lib/vault/queries';
import { VaultClient } from './vault-client';

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const viewer = await getViewerPlan();
  const role = await getUserRole();
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';

  const data = await getVaultData(user.id);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <LandingHeader signedIn isAdmin={isAdmin} isPaid={isPaid} onLanding />
      <VaultClient data={data} isPaid={isPaid} />
    </div>
  );
}
