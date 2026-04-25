import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/interview/setup');

  return (
    <main className="min-h-screen bg-[#0a1628] text-[#f5efe2] flex items-center justify-center p-12">
      <div className="max-w-2xl text-center">
        <h1 className="font-serif text-6xl mb-6">HARDO</h1>
        <p className="text-xl text-[#f5efe2]/70 mb-12">
          AI-powered Investment Banking mock interviews. Land your offer.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium px-8 py-4 rounded hover:bg-[#d4a04a]/90 transition"
        >
          Sign in to start
        </Link>
      </div>
    </main>
  );
}
