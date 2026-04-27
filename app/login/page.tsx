import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginClient from './login-client';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/interview/setup');
  }
  return <LoginClient />;
}
