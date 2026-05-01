import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const { data: stepsRaw } = await supabase
    .from('interview_steps')
    .select('id, order_index, is_follow_up, parent_step_id, question_id, custom_question, user_answer, answered_at, ai_status, ai_grade, ai_feedback, questions(id, question, category, subtopic, difficulty)')
    .eq('interview_id', id)
    .order('order_index', { ascending: true });

  const steps = stepsRaw ?? [];
  const stepIds = steps.map((s: any) => s.id);

  let answers: any[] = [];
  if (stepIds.length > 0) {
    const { data: ans } = await supabase
      .from('answers')
      .select('id, interview_step_id, user_answer, answer_type, created_at')
      .in('interview_step_id', stepIds)
      .order('created_at', { ascending: true });
    answers = ans ?? [];
  }

  return NextResponse.json({ steps, answers });
}
