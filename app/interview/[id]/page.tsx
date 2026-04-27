import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

type Step = {
  order_index: number;
  question_id: number | null;
  questions: { question: string; category: string; subtopic: string; difficulty: number } | null;
};

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, candidate_level, total_questions, status, started_at')
    .eq('id', id)
    .maybeSingle();

  if (!interview) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] flex items-center justify-center">
        <div className="text-center">
          <p className="font-playfair italic text-3xl mb-4">Interview not found.</p>
          <a href="/interview/setup" className="text-[#d4a04a] underline">Start a new one</a>
        </div>
      </div>
    );
  }

  const { data: stepsRaw } = await supabase
    .from('interview_steps')
    .select('order_index, question_id, questions(question, category, subtopic, difficulty)')
    .eq('interview_id', id)
    .order('order_index', { ascending: true });

  const steps = (stepsRaw ?? []) as unknown as Step[];

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter px-12 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-3">
          - {interview.candidate_level.toUpperCase()} INTERVIEW - PREVIEW MODE
        </div>
        <h1 className="font-playfair text-4xl mb-2">
          Your <span className="italic text-[#d4a04a]">12 questions</span> are ready.
        </h1>
        <p className="text-[#f5efe2]/65 mb-10">
          Below is the seeded list. The live interview UI (timer, voice, AI follow-ups) lands in the next iteration.
        </p>

        <ol className="space-y-4">
          {steps.map((s) => (
            <li key={s.order_index} className="border border-[#f5efe2]/10 rounded-sm p-5 bg-[#0e1c33]/40">
              <div className="flex items-center justify-between text-[11px] tracking-[0.18em] text-[#f5efe2]/55 mb-3">
                <span>Q{String(s.order_index).padStart(2, '0')} / 12</span>
                <span>{s.questions?.category?.toUpperCase() ?? 'UNKNOWN'} - DIFF {s.questions?.difficulty ?? '-'}</span>
              </div>
              <p className="font-playfair text-lg leading-[1.5]">
                {s.questions?.question ?? '(question text unavailable)'}
              </p>
              {s.questions?.subtopic && (
                <div className="mt-2 text-xs text-[#f5efe2]/45 tracking-[0.12em]">
                  topic: {s.questions.subtopic}
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-12 flex items-center justify-between">
          <a href="/interview/setup" className="text-[#f5efe2]/55 text-sm underline underline-offset-4">
            Pick a different level
          </a>
          <span className="text-xs tracking-[0.18em] text-[#f5efe2]/45">
            INTERVIEW ID {id.slice(0, 8)}...
          </span>
        </div>
      </div>
    </div>
  );
}
