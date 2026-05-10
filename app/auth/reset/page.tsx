import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import Brand from '@/app/_components/Brand';
import ResetForm from './reset-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set a new password \u2014 HARDO',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // No active recovery session — send back to login
    redirect('/login?reset=expired');
  }

  return (
    <main className="min-h-screen bg-[#FBF7EE] grid place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <Brand size="md" href="/" />
        </div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#11161E]/50 mb-3">
          {'\u2014 PASSWORD RESET'}
        </div>
        <h1 className="font-serif text-4xl leading-tight mb-3">
          Set a new password.
        </h1>
        <p className="text-[#11161E]/70 mb-8 text-[14px] leading-relaxed">
          Pick something at least 8 characters. You{'\u2019'}ll be signed in right after.
        </p>
        <ResetForm email={user.email ?? ''} />
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#11161E]/35 mt-12">
          Signed in as <span className="text-[#11161E]/55">{user.email}</span>
        </p>
      </div>
    </main>
  );
}
