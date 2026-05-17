import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth/roles';
import { listAllQuestions } from '@/lib/admin/questions';
import QuestionsTable from './QuestionsTable';

export const dynamic = 'force-dynamic';

export default async function QuestionsAdminPage() {
  const role = await getUserRole();
  if (role !== 'admin') {
    redirect('/admin/knowledge');
  }
  const questions = await listAllQuestions();

  return (
    <div className="max-w-page mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="kicker mb-1">Admin · Question Lab</div>
          <h1 className="font-serif text-[36px] font-light leading-tight tracking-[-0.01em]">
            Question Lab
          </h1>
          <p className="mt-2 text-ink-2 text-[14px] max-w-2xl">
            Pick a question, run it through the production interviewer in isolation, and inspect the structured feedback. Nothing here is saved — it is a sandbox for tuning prompts and questions.
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {questions.length} questions
        </div>
      </div>

      <QuestionsTable questions={questions} />
    </div>
  );
}
