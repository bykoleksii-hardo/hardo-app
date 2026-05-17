import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getUserRole } from '@/lib/auth/roles';
import { getQuestionById } from '@/lib/admin/questions';
import QuestionLab from './QuestionLab';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export default async function QuestionDetailPage(
  { params }: { params: Promise<Params> }
) {
  const role = await getUserRole();
  if (role !== 'admin') {
    redirect('/admin/knowledge');
  }
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();
  const q = await getQuestionById(numericId);
  if (!q) notFound();

  return (
    <div className="max-w-page mx-auto px-6 py-10">
      <div className="mb-8">
        <Link
          href="/admin/questions"
          className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink"
        >
          <span aria-hidden>{'\u2190'}</span> Back to all questions
        </Link>
      </div>
      <QuestionLab question={q} />
    </div>
  );
}
