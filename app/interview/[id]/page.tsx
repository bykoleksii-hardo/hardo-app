import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import InterviewClient from './interview-client';

export const dynamic = 'force-dynamic';

type StepRow = {
  id: string;
  order_index: number;
  is_follow_up: boolean;
  parent_step_id: string | null;
  question_id: number | null;
  custom_question: string | null;
  user_answer: string | null;
  answered_at: string | null;
  ai_status: string | null;
  ai_grade: string | null;
  ai_feedback: string | null;
  questions: {
    id: number;
    question: string;
    category: string;
    subtopic: string | null;
    difficulty: number | null;
  } | null;
};

type AnswerRow = {
  id: string;
  interview_step_id: string;
  user_answer: string;
  answer_type: string;
  created_at: string;
};

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, candidate_level, total_questions, status, started_at, finished_at')
    .eq('id', id)
    .maybeSingle();

  if (!interview) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] flex items-center justify-center font-inter">
        <div className="text-center">
          <p className="font-playfair italic text-3xl mb-4">Interview not found.</p>
          <a href="/interview/setup" className="text-[#d4a04a] underline">Start a new one</a>
        </div>
      </div>
    );
  }

  if (interview.status === 'completed') {
    redirect(`/interview/${id}/summary`);
  }

  const { data: stepsRaw } = await supabase
    .from('interview_steps')
    .select('id, order_index, is_follow_up, parent_step_id, question_id, custom_question, user_answer, answered_at, ai_status, ai_grade, ai_feedback, questions(id, question, category, subtopic, difficulty)')
    .eq('interview_id', id)
    .order('order_index', { ascending: true });
  const steps = (stepsRaw ?? []) as unknown as StepRow[];

  const stepIds = steps.map(s => s.id);
  let answers: AnswerRow[] = [];
  if (stepIds.length > 0) {
    const { data: answerRows } = await supabase
      .from('answers')
      .select('id, interview_step_id, user_answer, answer_type, created_at')
      .in('interview_step_id', stepIds)
      .order('created_at', { ascending: true });
    answers = (answerRows ?? []) as AnswerRow[];
  }

  return (
    <InterviewClient
      interviewId={id}
      level={interview.candidate_level}
      totalQuestions={interview.total_questions ?? 12}
      steps={steps}
      answers={answers}
    />
  );
}
