import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type StepRow = {
  id: string;
  order_index: number;
  is_follow_up: boolean;
  parent_step_id: string | null;
  custom_question: string | null;
  user_answer: string | null;
  ai_grade: string | null;
  ai_score: string | null;
  ai_feedback: string | null;
  ai_status: string | null;
  questions: { question: string; category: string; subtopic: string | null } | null;
};

type SummaryRow = {
  overall_score: number;
  overall_strengths: string;
  overall_weaknesses: string;
  final_feedback: string;
  hire_recommendation: string;
};

type ParsedFeedback = {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
};

function parseFeedback(raw: string | null): { summary: string; strengths: string[]; weaknesses: string[] } | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as ParsedFeedback;
    return {
      summary: typeof j.summary === 'string' ? j.summary : '',
      strengths: Array.isArray(j.strengths) ? j.strengths : [],
      weaknesses: Array.isArray(j.weaknesses) ? j.weaknesses : [],
    };
  } catch {
    return { summary: raw, strengths: [], weaknesses: [] };
  }
}

const HIRE_LABEL: Record<string, { label: string; tone: 'pos' | 'neg' | 'neutral_pos' | 'neutral_neg' }> = {
  hire: { label: 'Hire', tone: 'pos' },
  leaning_hire: { label: 'Leaning Hire', tone: 'neutral_pos' },
  leaning_no_hire: { label: 'Leaning No Hire', tone: 'neutral_neg' },
  no_hire: { label: 'No Hire', tone: 'neg' },
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
    .select('id, order_index, is_follow_up, parent_step_id, custom_question, user_answer, ai_grade, ai_score, ai_feedback, ai_status, questions(question, category, subtopic)')
    .eq('interview_id', id)
    .order('order_index', { ascending: true });

  const steps = (stepsRaw ?? []) as unknown as StepRow[];
  const mainSteps = steps.filter(s => !s.is_follow_up);
  const followUpsByParent = new Map<string, StepRow[]>();
  steps.filter(s => s.is_follow_up && s.parent_step_id).forEach(f => {
    const arr = followUpsByParent.get(f.parent_step_id!) ?? [];
    arr.push(f);
    followUpsByParent.set(f.parent_step_id!, arr);
  });

  const { data: summaryRaw } = await supabase
    .from('interview_summaries')
    .select('overall_score, overall_strengths, overall_weaknesses, final_feedback, hire_recommendation')
    .eq('interview_id', id)
    .maybeSingle();
  const summary = summaryRaw as SummaryRow | null;

  const isCompleted = interview.status === 'completed' && !!summary;
  const answeredCount = mainSteps.filter(s => s.user_answer).length;
  const hireMeta = summary ? HIRE_LABEL[summary.hire_recommendation] : null;
  const hireToneClass = hireMeta?.tone === 'pos' ? 'text-emerald-300'
    : hireMeta?.tone === 'neutral_pos' ? 'text-emerald-200/80'
    : hireMeta?.tone === 'neutral_neg' ? 'text-amber-300/80'
    : hireMeta?.tone === 'neg' ? 'text-rose-300'
    : 'text-[#f5efe2]/75';

  const heading = isCompleted
    ? 'Your scorecard is ready.'
    : 'The interview is wrapping up.';
  const subheading = isCompleted
    ? 'Honest, specific, like a real MD signed off. Below is the per-question breakdown with grades, feedback, and the follow-ups the interviewer pressed on.'
    : 'Detailed grading is being prepared. For now, here is the full transcript: your answers and where the interviewer will dig deeper next time.';

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
          {heading}
        </h1>
        <p className="text-[#f5efe2]/65 max-w-2xl mb-12">
          {subheading}
        </p>

        <div className="border border-[#f5efe2]/15 bg-[#0e1c33]/40 p-8 mb-12 grid grid-cols-3 gap-8">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">OVERALL</div>
            <div className="font-playfair text-4xl text-[#d4a04a]">{summary?.overall_score ?? interview.final_score ?? '-'}</div>
            <div className="text-[11px] text-[#f5efe2]/45 mt-1">{isCompleted ? 'out of 100' : 'awaiting AI review'}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">QUESTIONS</div>
            <div className="font-playfair text-4xl">{answeredCount} / {interview.total_questions}</div>
            <div className="text-[11px] text-[#f5efe2]/45 mt-1">answered</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">RECOMMENDATION</div>
            <div className={`font-playfair text-4xl ${hireToneClass}`}>{hireMeta?.label ?? '—'}</div>
            <div className="text-[11px] text-[#f5efe2]/45 mt-1">
              {interview.finished_at ? new Date(interview.finished_at).toLocaleString() : (isCompleted ? '' : interview.status?.toString().toUpperCase())}
            </div>
          </div>
        </div>

        {isCompleted && summary && (
          <div className="border border-[#d4a04a]/30 bg-[#0e1c33]/30 p-6 mb-12">
            <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-3">OVERALL FEEDBACK</div>
            <p className="text-[#f5efe2]/85 text-[14px] leading-[1.7] whitespace-pre-wrap mb-5">{summary.final_feedback}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-[11px] tracking-[0.22em] text-emerald-300/90 mb-2">STRENGTHS</div>
                <p className="text-[#f5efe2]/80 text-[14px] leading-[1.7] whitespace-pre-wrap">{summary.overall_strengths}</p>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.22em] text-rose-300/90 mb-2">WEAKNESSES</div>
                <p className="text-[#f5efe2]/80 text-[14px] leading-[1.7] whitespace-pre-wrap">{summary.overall_weaknesses}</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="font-playfair text-2xl mb-6">Question by question</h2>
        <ol className="space-y-6">
          {mainSteps.map((s) => {
            const followUps = followUpsByParent.get(s.id) ?? [];
            const fb = parseFeedback(s.ai_feedback);
            const grade = s.ai_grade ?? s.ai_score;
            return (
              <li key={s.id} className="border border-[#f5efe2]/10 bg-[#0e1c33]/30 p-6">
                <div className="flex items-center justify-between text-[11px] tracking-[0.22em] text-[#f5efe2]/55 mb-3">
                  <span>Q{String(s.order_index).padStart(2,'0')}{' · '}{(s.questions?.category ?? '').toUpperCase()}</span>
                  <span className="text-[#d4a04a]">{isCompleted ? (grade ?? 'N/A') : '—'}</span>
                </div>
                <p className="font-playfair text-lg leading-[1.5] mb-4">{s.questions?.question}</p>
                <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">YOUR ANSWER</div>
                <p className="text-[#f5efe2]/85 text-[14px] leading-[1.6] whitespace-pre-wrap">
                  {s.user_answer ?? <span className="text-[#f5efe2]/35 italic">not answered</span>}
                </p>
                {fb && (fb.summary || fb.strengths.length > 0 || fb.weaknesses.length > 0) && (
                  <div className="mt-5">
                    <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-2">FEEDBACK</div>
                    {fb.summary && <p className="text-[#f5efe2]/85 text-[14px] leading-[1.6] mb-3">{fb.summary}</p>}
                    {fb.strengths.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[10px] tracking-[0.22em] text-emerald-300/90 mb-1">STRENGTHS</div>
                        <ul className="list-disc list-inside text-[13px] text-[#f5efe2]/80 space-y-1">
                          {fb.strengths.map((s,i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {fb.weaknesses.length > 0 && (
                      <div>
                        <div className="text-[10px] tracking-[0.22em] text-rose-300/90 mb-1">WEAKNESSES</div>
                        <ul className="list-disc list-inside text-[13px] text-[#f5efe2]/80 space-y-1">
                          {fb.weaknesses.map((w,i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {followUps.length > 0 && (
                  <div className="mt-5 border-l border-[#d4a04a]/40 pl-4 space-y-4">
                    <div className="text-[10px] tracking-[0.22em] text-[#d4a04a]">FOLLOW-UPS</div>
                    {followUps.map(f => (
                      <div key={f.id} className="text-[13px]">
                        <p className="font-playfair italic text-[#f5efe2]/75 mb-1">{f.custom_question ?? f.questions?.question}</p>
                        <p className="text-[#f5efe2]/85 leading-[1.6] whitespace-pre-wrap">{f.user_answer ?? <span className="text-[#f5efe2]/35 italic">not answered</span>}</p>
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
