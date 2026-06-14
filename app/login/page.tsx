import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginClient from './login-client';

export const metadata: Metadata = {
  title: 'Sign In — HARDO',
  description: 'Sign in to HARDO to run AI investment banking mock interviews and review your scorecard.',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/interview/setup');
  }
  return <LoginClient />;
}
