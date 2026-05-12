import { redirect } from 'next/navigation';
import Brand from '@/app/_components/Brand';
import ShareLinkButton from './share-button';
import SummaryQuestions from './SummaryQuestions';
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
  created_at: string | null;
  answered_at: string | null;
  time_limit_seconds: number | null;
  was_overtime: boolean | null;
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

function formatPace(step: { created_at: string | null; answered_at: string | null; time_limit_seconds: number | null; was_overtime: boolean | null; }): { text: string; over: boolean } | null {
  if (!step.created_at || !step.answered_at) return null;
  const a = new Date(step.created_at).getTime();
  const b = new Date(step.answered_at).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  const elapsed = Math.max(0, Math.round((b - a) / 1000));
  const limit = step.time_limit_seconds ?? null;
  const over = !!step.was_overtime;
  const fmt = (s: number) => {
    const m = Math.floor(s/60); const r = s % 60;
    return String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0');
  };
  if (limit) return { text: fmt(elapsed) + ' of ' + fmt(limit), over };
  return { text: fmt(elapsed), over };
}

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
    .select('id, order_index, is_follow_up, parent_step_id, custom_question, user_answer, ai_grade, ai_score, ai_feedback, ai_status, created_at, answered_at, time_limit_seconds, was_overtime, questions(question, category, subtopic)')
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

  const stepIds = steps.map((s) => s.id);
  const { data: feedbackRaw } = stepIds.length > 0
    ? await supabase
        .from('interview_step_feedback')
        .select('step_id, rating')
        .eq('user_id', user.id)
        .in('step_id', stepIds)
    : { data: [] as { step_id: string; rating: number }[] };
  const initialFeedback: Record<string, -1 | 1> = {};
  for (const row of (feedbackRaw ?? []) as { step_id: string; rating: number }[]) {
    if (row.rating === 1 || row.rating === -1) initialFeedback[row.step_id] = row.rating;
  }

  const isCompleted = interview.status === 'completed' && !!summary;
  const answeredCount = mainSteps.filter(s => s.user_answer).length;
  const hireMeta = summary ? HIRE_LABEL[summary.hire_recommendation] : null;
  const hireToneClass = hireMeta?.tone === 'pos' ? 'text-[#1F6F3D]'
    : hireMeta?.tone === 'neutral_pos' ? 'text-[#3F7A4A]'
    : hireMeta?.tone === 'neutral_neg' ? 'text-[#A85A1F]'
    : hireMeta?.tone === 'neg' ? 'text-[#9C2E2E]'
    : 'text-[#11161E]/75';

  const heading = isCompleted
    ? 'Your scorecard is ready.'
    : 'The interview is wrapping up.';
  const subheading = isCompleted
    ? 'Honest, specific, like a real MD signed off. Below is the per-question breakdown with grades, feedback, and the follow-ups the interviewer pressed on.'
    : 'Detailed grading is being prepared. For now, here is the full transcript: your answers and where the interviewer will dig deeper next time.';

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#11161E] font-inter">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#11161E]/10">
        <div className="flex items-center gap-6">
          <Brand size="md" href="/" />
          <span className="text-[11px] tracking-[0.22em] text-[#11161E]/45">
            {'SCORECARD / '}{interview.candidate_level.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ShareLinkButton />
          <a href="/interview/setup" className="text-[11px] tracking-[0.22em] border border-[#11161E]/20 px-4 py-2 hover:text-[#B88736]">
            NEW INTERVIEW
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-3">{'> YOUR SCORECARD'}</div>
        <h1 className="font-playfair text-5xl leading-[1.15] mb-6">
          {heading}
        </h1>
        <p className="text-[#11161E]/65 max-w-2xl mb-12">
          {subheading}
        </p>

        <div className="border border-[#11161E]/15 bg-[#F2ECDF]/40 p-8 mb-12 grid grid-cols-3 gap-8">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#11161E]/45 mb-2">— OVERALL</div>
            <div className="font-playfair text-4xl text-[#11161E]">{summary?.overall_score ?? interview.final_score ?? '-'}</div>
            <div className="text-[11px] text-[#11161E]/45 mt-1">{isCompleted ? 'out of 100' : 'awaiting AI review'}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#11161E]/45 mb-2">— QUESTIONS</div>
            <div className="font-playfair text-4xl">{answeredCount} / {interview.total_questions}</div>
            <div className="text-[11px] text-[#11161E]/45 mt-1">answered</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#11161E]/45 mb-2">— RECOMMENDATION</div>
            <div className={`font-playfair text-4xl ${hireToneClass}`}>{hireMeta?.label ?? '—'}</div>
            <div className="text-[11px] text-[#11161E]/45 mt-1">
              {interview.finished_at ? new Date(interview.finished_at).toLocaleString() : (isCompleted ? '' : interview.status?.toString().toUpperCase())}
            </div>
          </div>
        </div>

        {isCompleted && summary && (
          <div className="border border-[#B88736]/30 bg-[#F2ECDF]/30 p-6 mb-12">
            <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-3">— OVERALL FEEDBACK</div>
            <p className="text-[#11161E]/85 text-[14px] leading-[1.7] whitespace-pre-wrap mb-5">{summary.final_feedback}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-[11px] tracking-[0.22em] text-[#1F6F3D] mb-2">— STRENGTHS</div>
                <p className="text-[#11161E]/80 text-[14px] leading-[1.7] whitespace-pre-wrap">{summary.overall_strengths}</p>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.22em] text-[#9C2E2E] mb-2">— WEAKNESSES</div>
                <p className="text-[#11161E]/80 text-[14px] leading-[1.7] whitespace-pre-wrap">{summary.overall_weaknesses}</p>
              </div>
            </div>
          </div>
        )}

        <SummaryQuestions steps={steps} isCompleted={isCompleted} initialFeedback={initialFeedback} />

        <div className="mt-12 text-center">
          <a href="/interview/setup" className="inline-block bg-[#B88736] text-[#FBF7EE] tracking-wide px-8 py-3 font-medium hover:bg-[#B88736]">
            Run another interview {'—'}
          </a>
        </div>
      </div>
    </div>
  );
}
