import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { chatJSON, OpenAIError } from '@/lib/openai';
import {
  FINALIZE_SYSTEM_PROMPT,
  FINALIZE_SCHEMA,
  type FinalizeAIResult,
} from '@/lib/interview-prompts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { interviewId?: string } | null;
  if (!body?.interviewId) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, candidate_level, status, total_questions')
    .eq('id', body.interviewId)
    .maybeSingle();
  if (!interview) return NextResponse.json({ error: 'interview not found' }, { status: 404 });

  // Skip if already completed and a summary exists.
  const { data: existing } = await supabase
    .from('interview_summaries')
    .select('id')
    .eq('interview_id', interview.id)
    .maybeSingle();
  if (existing) {
    await supabase.from('interviews').update({ status: 'completed', finished_at: new Date().toISOString() }).eq('id', interview.id);
    return NextResponse.json({ ok: true, already: true, summary_id: existing.id });
  }

  // Pull every step + its grade + answers for the AI.
  const { data: stepsRaw } = await supabase
    .from('interview_steps')
    .select('id, order_index, is_follow_up, parent_step_id, custom_question, ai_grade, ai_feedback, user_answer, questions(question, category, subtopic)')
    .eq('interview_id', interview.id)
    .order('order_index', { ascending: true });
  type S = {
    id: string; order_index: number; is_follow_up: boolean; parent_step_id: string | null;
    custom_question: string | null; ai_grade: string | null; ai_feedback: string | null;
    user_answer: string | null;
    questions: { question: string; category: string; subtopic: string | null } | null;
  };
  const steps = (stepsRaw ?? []) as unknown as S[];
  const baseSteps = steps.filter(s => !s.is_follow_up);

  const lines: string[] = [
    `Candidate level: ${interview.candidate_level}`,
    `Total base questions: ${baseSteps.length}`,
    ``,
    `PER-BLOCK BREAKDOWN:`,
  ];
  for (const b of baseSteps) {
    const q = b.questions?.question ?? '(unknown question)';
    const cat = b.questions?.category ?? '';
    lines.push(`\nBlock ${b.order_index} [${cat}] grade=${b.ai_grade ?? '-'}`);
    lines.push(`Q: ${q}`);
    if (b.user_answer) lines.push(`A: ${b.user_answer.slice(0, 600)}`);
    if (b.ai_feedback) lines.push(`Feedback: ${b.ai_feedback.slice(0, 400)}`);
    const followUps = steps.filter(s => s.parent_step_id === b.id && s.is_follow_up);
    for (const f of followUps) {
      lines.push(`  - FU: ${(f.custom_question ?? '').slice(0, 200)}`);
      if (f.user_answer) lines.push(`    A: ${f.user_answer.slice(0, 400)}`);
    }
  }

  let ai: FinalizeAIResult;
  let tokens = 0;
  try {
    const out = await chatJSON<FinalizeAIResult>({
      schemaName: 'hardo_finalize',
      schema: FINALIZE_SCHEMA,
      maxTokens: 1100,
      messages: [
        { role: 'system', content: FINALIZE_SYSTEM_PROMPT },
        { role: 'user', content: lines.join('\n') },
      ],
    });
    ai = out.data;
    tokens = out.tokens;
  } catch (e) {
    if (e instanceof OpenAIError) {
      console.error('[finalize] openai error', { status: e.status, code: e.code, type: e.type, message: e.message, raw: e.rawBody });
      return NextResponse.json({ error: e.message, code: e.code, friendly: e.friendly }, { status: 502 });
    }
    console.error('[finalize] openai error (unknown)', e);
    return NextResponse.json({ error: (e as Error).message, friendly: 'The interviewer is unavailable right now. Please try again later.' }, { status: 502 });
  }

  const score = Math.max(0, Math.min(100, Math.round(ai.overall_score)));

  const { data: inserted, error: insErr } = await supabase
    .from('interview_summaries')
    .insert({
      interview_id: interview.id,
      overall_score: score,
      overall_strengths: ai.overall_strengths,
      overall_weaknesses: ai.overall_weaknesses,
      final_feedback: ai.final_feedback,
      hire_recommendation: ai.hire_recommendation,
      tokens_used: tokens,
    })
    .select('id')
    .maybeSingle();
  if (insErr) {
    console.error('[finalize] insert summary error', insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  await supabase
    .from('interviews')
    .update({ status: 'completed', finished_at: new Date().toISOString(), final_score: score })
    .eq('id', interview.id);

  return NextResponse.json({
    ok: true,
    summary_id: inserted?.id ?? null,
    overall_score: score,
  });
}
