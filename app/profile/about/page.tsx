import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/profile-data';
import { AboutForm } from './about-form';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getUserProfile(user.id);
  return <AboutForm initial={profile} email={user.email ?? ''} />;
}
