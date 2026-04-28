import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type StepRow = {
  id: number;
  order_index: number;
  is_follow_up: boolean;
  parent_step_id: number | null;
  user_answer: string | null;
  ai_score: string | null;
  ai_feedback: string | null;
  questions: { question: string; category: string; subtopic: string | null } | null;
};

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, candidate_level, total_questions, status, started_at, finished_at, final_score')
    .eq('id', id)
    .maybeSingle();

  if (!interview) redirect('/interview/setup');

  const { data: stepsRaw } = await supabase
    .from('interview_steps')
    .select('id, order_index, is_follow_up, parent_step_id, user_answer, ai_score, ai_feedback, questions(question, category, subtopic)')
    .eq('interview_id', id)
    .order('order_index', { ascending: true });

  const steps = (stepsRaw ?? []) as unknown as StepRow[];
  const mainSteps = steps.filter(s => !s.is_follow_up);
  const followUpsBy = (parentId: number) => steps.filter(s => s.is_follow_up && s.parent_step_id === parentId);

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#f5efe2]/10">
        <div className="flex items-center gap-6">
          <span className="font-playfair text-xl">HARDO</span>
          <span className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45">
            {'SCORECARD / '}{interview.candidate_level.toUpperCase()}
          </span>
        </div>
        <a href="/interview/setup" className="text-[11px] tracking-[0.22em] border border-[#f5efe2]/20 px-4 py-2 hover:text-[#d4a04a]">
          NEW INTERVIEW
        </a>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-3">{'> YOUR SCORECARD'}</div>
        <h1 className="font-playfair text-5xl leading-[1.15] mb-6">
          The interview is <span className="italic text-[#d4a04a]">done.</span>
        </h1>
        <p className="text-[#f5efe2]/65 max-w-2xl mb-12">
          Detailed grading is being prepared. For now, here is the full transcript: your answers and where the interviewer will dig deeper next time.
        </p>

        <div className="border border-[#f5efe2]/15 bg-[#0e1c33]/40 p-8 mb-12 grid grid-cols-3 gap-8">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">OVERALL</div>
            <div className="font-playfair text-4xl text-[#d4a04a]">{interview.final_score ?? '-'}</div>
            <div className="text-[11px] text-[#f5efe2]/45 mt-1">awaiting AI review</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">QUESTIONS</div>
            <div className="font-playfair text-4xl">{mainSteps.filter(s=>s.user_answer).length} / {interview.total_questions}</div>
            <div className="text-[11px] text-[#f5efe2]/45 mt-1">answered</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">STATUS</div>
            <div className="font-playfair text-4xl">{(interview.status ?? '-').toString().toUpperCase()}</div>
            <div className="text-[11px] text-[#f5efe2]/45 mt-1">
              {interview.finished_at ? new Date(interview.finished_at).toLocaleString() : ''}
            </div>
          </div>
        </div>

        <h2 className="font-playfair text-2xl mb-6">Question by question</h2>
        <ol className="space-y-6">
          {mainSteps.map((s) => {
            const followUps = followUpsBy(s.id);
            return (
              <li key={s.id} className="border border-[#f5efe2]/10 bg-[#0e1c33]/30 p-6">
                <div className="flex items-center justify-between text-[11px] tracking-[0.22em] text-[#f5efe2]/55 mb-3">
                  <span>Q{String(s.order_index).padStart(2,'0')}{' · '}{(s.questions?.category ?? '').toUpperCase()}</span>
                  <span className="text-[#d4a04a]">{s.ai_score ?? 'TBD'}</span>
                </div>
                <p className="font-playfair text-lg leading-[1.5] mb-4">{s.questions?.question}</p>
                <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">YOUR ANSWER</div>
                <p className="text-[#f5efe2]/85 text-[14px] leading-[1.6] whitespace-pre-wrap">
                  {s.user_answer ?? <span className="text-[#f5efe2]/35 italic">not answered</span>}
                </p>
                {s.ai_feedback && (
                  <>
                    <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mt-5 mb-2">FEEDBACK</div>
                    <p className="text-[#f5efe2]/85 text-[14px] leading-[1.6]">{s.ai_feedback}</p>
                  </>
                )}
                {followUps.length > 0 && (
                  <div className="mt-5 border-l border-[#d4a04a]/40 pl-4 space-y-3">
                    <div className="text-[10px] tracking-[0.22em] text-[#d4a04a]">FOLLOW-UPS</div>
                    {followUps.map(f => (
                      <div key={f.id} className="text-[13px]">
                        <p className="font-playfair italic text-[#f5efe2]/85">{f.questions?.question}</p>
                        {f.user_answer && <p className="mt-1 text-[#f5efe2]/65">{f.user_answer}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-12 text-center">
          <a href="/interview/setup" className="inline-block bg-[#d4a04a] text-[#0a1628] tracking-wide px-8 py-3 font-medium hover:bg-[#e0ae54]">
            Run another interview {'→'}
          </a>
        </div>
      </div>
    </div>
  );
}
