import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { SetupClient } from './setup-client';

export default async function SetupPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <SetupClient userEmail={user.email ?? ''} />;
}
