import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function InterviewSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] p-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-5xl mb-2">Configure Your Mock</h1>
        <p className="text-[#f5efe2]/70 mb-12">Choose difficulty, topic, and format. We'll generate your interview.</p>
        <p className="text-[#d4a04a]">Welcome, {user.email}</p>
        <p className="text-sm text-[#f5efe2]/50 mt-8">Setup wizard coming soon — schema is ready in the database.</p>
      </div>
    </div>
  );
}
