import { redirect, notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import LandingHeader from '@/app/(landing)/_components/Header';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';
import { getQuestionDetail } from '@/lib/vault/queries';
import { QuestionDetailClient } from './detail-client';

export const dynamic = 'force-dynamic';

export default async function VaultQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questionId = Number(id);
  if (!Number.isInteger(questionId) || questionId <= 0) notFound();

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const detail = await getQuestionDetail(user.id, questionId);
  if (!detail) notFound();
  // Locked questions are not browsable individually — send the user back to the grid.
  if (!detail.unlocked) redirect('/vault');

  const viewer = await getViewerPlan();
  const role = await getUserRole();
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <LandingHeader signedIn isAdmin={isAdmin} isPaid={isPaid} onLanding />
      <QuestionDetailClient detail={detail} isPaid={isPaid} />
    </div>
  );
}
