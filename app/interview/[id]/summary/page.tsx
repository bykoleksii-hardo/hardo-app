import { redirect } from 'next/navigation';
import Brand from '@/app/_components/Brand';
import ShareLinkButton from './share-button';
import SummaryQuestions from './SummaryQuestions';
import OverallFeedback from './OverallFeedback';
import NextStepsCard from './NextStepsCard';
import CountUp from '@/app/_components/CountUp';
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

type FinalFeedbackShape = {
  summary: string;
  next_steps_plan: string[];
  weakest_block_label: string;
  strongest_moment: string;
};

function parseFinalFeedback(raw: string | null | undefined): FinalFeedbackShape {
  const empty: FinalFeedbackShape = { summary: '', next_steps_plan: [], weakest_block_label: '', strongest_moment: '' };
  if (!raw) return empty;
  // New format: JSON object with summary + next_steps_plan + weakest_block_label + strongest_moment.
  // Legacy format: plain string.
  if (raw.trim().startsWith('{')) {
    try {
      const j = JSON.parse(raw) as Partial<FinalFeedbackShape> & Record<string, unknown>;
      return {
        summary: typeof j.summary === 'string' ? j.summary : '',
        next_steps_plan: Array.isArray(j.next_steps_plan) ? j.next_steps_plan.filter((x): x is string => typeof x === 'string') : [],
        weakest_block_label: typeof j.weakest_block_label === 'string' ? j.weakest_block_label : '',
        strongest_moment: typeof j.strongest_moment === 'string' ? j.strongest_moment : '',
      };
    } catch {
      return { ...empty, summary: raw };
    }
  }
  return { ...empty, summary: raw };
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
    .select('id, candidate_level, total_questions, status, started_at, finished_at, final_score, input_mode')
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

  // Aggregate the per-block rubric axes (0-4) into an interview-wide skill
  // profile. Blocks graded before the rubric existed simply don't contribute.
  const rubricProfile = (() => {
    const keys = ['correctness', 'depth', 'structure', 'communication'] as const;
    const labels: Record<string, string> = { correctness: 'Correctness', depth: 'Depth', structure: 'Structure', communication: 'Communication' };
    const sums: Record<string, number> = { correctness: 0, depth: 0, structure: 0, communication: 0 };
    let n = 0;
    for (const s of mainSteps) {
      if (!s.ai_feedback) continue;
      try {
        const j = JSON.parse(s.ai_feedback) as { rubric?: Record<string, number> };
        const r = j.rubric;
        if (r && keys.every(k => typeof r[k] === 'number' && Number.isFinite(r[k]))) {
          for (const k of keys) sums[k] += r[k];
          n++;
        }
      } catch { /* legacy / non-JSON feedback */ }
    }
    if (n === 0) return null;
    return keys.map(k => ({ key: k, label: labels[k], value: sums[k] / n }));
  })();
  const hireMeta = summary ? HIRE_LABEL[summary.hire_recommendation] : null;
  const hireToneClass = hireMeta?.tone === 'pos' ? 'text-[#1F6F3D]'
    : hireMeta?.tone === 'neutral_pos' ? 'text-[#3F7A4A]'
    : hireMeta?.tone === 'neutral_neg' ? 'text-[#A85A1F]'
    : hireMeta?.tone === 'neg' ? 'text-[#9C2E2E]'
    : 'text-ink/75';

  const heading = isCompleted
    ? 'Your scorecard is ready.'
    : 'The interview is wrapping up.';
  const subheading = isCompleted
    ? 'Honest, specific, like a real MD signed off. Below is the per-question breakdown with grades, feedback, and the follow-ups the interviewer pressed on.'
    : 'Detailed grading is being prepared. For now, here is the full transcript: your answers and where the interviewer will dig deeper next time.';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 border-b border-ink/10">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Brand size="md" href="/" />
          <span className="hidden sm:inline text-[11px] tracking-[0.22em] text-ink/45 truncate">
            {'SCORECARD / '}{interview.candidate_level.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ShareLinkButton />
          <a href="/interview/setup" className="text-[11px] tracking-[0.22em] border border-ink/20 px-4 py-2 hover:text-gold">
            NEW INTERVIEW
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-12">
        <div className="anim-rise d1 text-[11px] tracking-[0.22em] text-gold mb-3">{'> YOUR SCORECARD'}</div>
        <h1 className="anim-rise d2 font-serif text-3xl sm:text-5xl leading-[1.15] mb-6">
          {heading}
        </h1>
        <p className="anim-rise d3 text-ink/65 max-w-2xl mb-12">
          {subheading}
        </p>

        {answeredCount < interview.total_questions && (
          <div className="border border-[#A85A1F]/30 bg-[#A85A1F]/5 px-6 py-4 mb-8 flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            <div>
              <div className="text-[11px] tracking-[0.22em] text-[#A85A1F] mb-1">— NOT COMPLETED</div>
              <p className="text-[13px] text-ink/70 max-w-xl">
                You answered {answeredCount} of {interview.total_questions} questions. This is a partial result based on what you completed — start a fresh interview to get a full scorecard.
              </p>
            </div>
            <a href="/interview/setup" className="shrink-0 text-[11px] tracking-[0.22em] border border-[#A85A1F]/40 text-[#A85A1F] px-4 py-2 hover:bg-[#A85A1F]/10">
              NEW INTERVIEW
            </a>
          </div>
        )}

        <div className="anim-rise d4 border border-ink/15 bg-cream/40 p-6 sm:p-8 mb-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-ink/45 mb-2">— OVERALL</div>
            <div className="font-serif text-4xl text-ink">{(() => { const raw = summary?.overall_score ?? interview.final_score; return raw == null ? '-' : <CountUp value={Math.round(Number(raw)) / 10} decimals={1} />; })()}</div>
            <div className="text-[11px] text-ink/45 mt-1">{isCompleted ? 'out of 10' : 'awaiting AI review'}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-ink/45 mb-2">— QUESTIONS</div>
            <div className="font-serif text-4xl">{answeredCount} / {interview.total_questions}</div>
            <div className="text-[11px] text-ink/45 mt-1">answered</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] text-ink/45 mb-2">— RECOMMENDATION</div>
            <div className={`font-serif text-4xl ${hireToneClass}`}>{hireMeta?.label ?? '—'}</div>
            <div className="text-[11px] text-ink/45 mt-1">
              {interview.finished_at ? new Date(interview.finished_at).toLocaleString() : (isCompleted ? '' : interview.status?.toString().toUpperCase())}
            </div>
          </div>
        </div>

        {isCompleted && summary && (() => {
          const final = parseFinalFeedback(summary.final_feedback);
          return (
            <OverallFeedback
              summary={final.summary}
              strongestMoment={final.strongest_moment}
              weakestBlock={final.weakest_block_label}
              prepPlan={final.next_steps_plan}
              strengths={summary.overall_strengths}
              weaknesses={summary.overall_weaknesses}
              rubricProfile={rubricProfile}
            />
          );
        })()}

        <SummaryQuestions steps={steps} isCompleted={isCompleted} initialFeedback={initialFeedback} />

        <NextStepsCard
          level={interview.candidate_level as 'intern' | 'analyst' | 'associate'}
          inputMode={(interview.input_mode === 'voice' ? 'voice' : 'text') as 'text' | 'voice'}
        />
      </div>
    </div>
  );
}
