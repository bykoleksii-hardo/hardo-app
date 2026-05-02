import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { chatJSON, OpenAIError } from '@/lib/openai';
import {
  TURN_SYSTEM_PROMPT,
  TURN_SCHEMA,
  buildTurnUserPrompt,
  type TurnAIResult,
  type TurnContext,
} from '@/lib/interview-prompts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NORMAL_MAX_FOLLOWUPS = 2;
const CASE_MAX_FOLLOWUPS = 5;

type StepRow = {
  id: string;
  interview_id: string;
  is_follow_up: boolean;
  parent_step_id: string | null;
  custom_question: string | null;
  order_index: number;
  questions: {
    id: number;
    question: string;
    category: string;
    subtopic: string | null;
    difficulty: number | null;
  } | null;
  interviews: { candidate_level: string; total_questions: number | null } | null;
};

type AnswerRow = {
  id: string;
  interview_step_id: string;
  user_answer: string;
  answer_type: string;
  created_at: string;
};

type ChildStepRow = {
  id: string;
  parent_step_id: string | null;
  is_follow_up: boolean;
  custom_question: string | null;
  order_index: number;
  user_answer: string | null;
  ai_feedback: string | null;
};

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { stepId?: string; message?: string } | null;
  if (!body?.stepId || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const message = body.message.trim();
  if (message.length < 1) {
    return NextResponse.json({ error: 'message empty' }, { status: 400 });
  }

  // 1. Resolve the step. The "active" step from the client is the BASE step of the block.
  //    If it is itself a follow-up, walk up to its parent so we always grade at the block root.
  const { data: rawStep, error: stepErr } = await supabase
    .from('interview_steps')
    .select('id, interview_id, is_follow_up, parent_step_id, custom_question, order_index, questions(id, question, category, subtopic, difficulty), interviews(candidate_level, total_questions)')
    .eq('id', body.stepId)
    .maybeSingle();
  if (stepErr || !rawStep) {
    return NextResponse.json({ error: stepErr?.message ?? 'step not found' }, { status: 404 });
  }
  let step = rawStep as unknown as StepRow;
  if (step.is_follow_up && step.parent_step_id) {
    const { data: parent } = await supabase
      .from('interview_steps')
      .select('id, interview_id, is_follow_up, parent_step_id, custom_question, order_index, questions(id, question, category, subtopic, difficulty), interviews(candidate_level, total_questions)')
      .eq('id', step.parent_step_id)
      .maybeSingle();
    if (parent) step = parent as unknown as StepRow;
  }
  const baseStepId = step.id;
  const interviewId = step.interview_id;
  const baseQuestion = step.questions?.question ?? '';
  const category = step.questions?.category ?? 'General';
  const subtopic = step.questions?.subtopic ?? null;
  const difficulty = step.questions?.difficulty ?? null;
  const level = (step.interviews?.candidate_level ?? 'analyst') as TurnContext['level'];
  const isCase = category.toLowerCase() === 'case study';
  const maxFollowUps = isCase ? CASE_MAX_FOLLOWUPS : NORMAL_MAX_FOLLOWUPS;

  // 2. Find every child follow-up step under this base, ordered.
  const { data: childRows } = await supabase
    .from('interview_steps')
    .select('id, parent_step_id, is_follow_up, custom_question, order_index, user_answer, ai_feedback')
    .eq('parent_step_id', baseStepId)
    .order('order_index', { ascending: true });
  const children = (childRows ?? []) as ChildStepRow[];
  const followUpStepIds = children.filter(c => c.is_follow_up).map(c => c.id);

  // Find the "current" step we are talking under: the last unanswered follow-up, or the base.
  const lastUnansweredFollowUp = children.filter(c => c.is_follow_up && !c.user_answer).pop();
  const currentStepId = lastUnansweredFollowUp?.id ?? baseStepId;

  // 3. Pull every answer row in this block (base + all follow-ups, in chronological order).
  const stepIdsForAnswers = [baseStepId, ...followUpStepIds];
  const { data: answerRows } = await supabase
    .from('answers')
    .select('id, interview_step_id, user_answer, answer_type, created_at')
    .in('interview_step_id', stepIdsForAnswers)
    .order('created_at', { ascending: true });
  const answers = (answerRows ?? []) as AnswerRow[];

  // 4. Build the in-block transcript that the AI will see.
  const transcript: TurnContext['transcript'] = [];
  // Walk in step order; for each step, push the question if it's a follow-up, then any answers/clarifications for it.
  const stepOrder: { id: string; question: string | null; isFollowUp: boolean }[] = [
    { id: baseStepId, question: null, isFollowUp: false }, // base question is shown separately
  ];
  for (const c of children) {
    if (c.is_follow_up) stepOrder.push({ id: c.id, question: c.custom_question ?? '', isFollowUp: true });
  }
  for (const s of stepOrder) {
    if (s.isFollowUp && s.question) {
      transcript.push({ role: 'ai', kind: 'follow_up', text: s.question });
    }
    const stepAnswers = answers.filter(a => a.interview_step_id === s.id);
    for (const a of stepAnswers) {
      const k: 'answer' | 'clarification' | 'clarification_response' =
        a.answer_type === 'clarification' ? 'clarification'
        : a.answer_type === 'clarification_response' ? 'clarification_response'
        : 'answer';
      const role: 'candidate' | 'ai' = k === 'clarification_response' ? 'ai' : 'candidate';
      transcript.push({ role, kind: k, text: a.user_answer });
    }
  }

  const followUpsSoFar = followUpStepIds.length;

  // 5. Call OpenAI with structured output.
  let ai: TurnAIResult;
  try {
    const out = await chatJSON<TurnAIResult>({
      schemaName: 'hardo_turn',
      schema: TURN_SCHEMA,
      messages: [
        { role: 'system', content: TURN_SYSTEM_PROMPT },
        { role: 'user', content: buildTurnUserPrompt({
          level, category, subtopic, difficulty,
          isCase, followUpsSoFar, maxFollowUps,
          question: baseQuestion,
          transcript,
          candidateMessage: message,
        }) },
      ],
    });
    ai = out.data;
    console.log('[turn] ai received', { kind: ai.kind, message_type: ai.message_type, grade: ai.grade, followUpsSoFar, maxFollowUps });
  } catch (e) {
    if (e instanceof OpenAIError) {
      console.error('[turn] openai error', { status: e.status, code: e.code, type: e.type, message: e.message, raw: e.rawBody });
      return NextResponse.json({ error: e.message, code: e.code, friendly: e.friendly }, { status: 502 });
    }
    console.error('[turn] openai error (unknown)', e);
    return NextResponse.json({ error: (e as Error).message, friendly: 'The interviewer is unavailable right now. Please try again later.' }, { status: 502 });
  }

  // 6. Persist the candidate's message.
  const candidateAnswerType = ai.message_type === 'clarification' ? 'clarification' : 'answer';
  const { error: candAnsErr } = await supabase.from('answers').insert({
    interview_step_id: currentStepId,
    user_answer: message,
    answer_type: candidateAnswerType,
  });
  if (candAnsErr) console.error('[turn] failed to insert candidate answer', candAnsErr);
  // For real answers also mark the step's user_answer/answered_at via submit_answer-equivalent update.
  if (candidateAnswerType === 'answer') {
    await supabase
      .from('interview_steps')
      .update({ user_answer: message, answered_at: new Date().toISOString() })
      .eq('id', currentStepId);
  }

  // 7. Branch on AI decision.
  if (ai.kind === 'clarification_response') {
    // Save the AI clarification reply as a separate "answer" row tagged differently.
    const { error: clarRepErr } = await supabase.from('answers').insert({
      interview_step_id: currentStepId,
      user_answer: ai.reply,
      answer_type: 'clarification_response',
    });
    if (clarRepErr) console.error('[turn] failed to insert clarification reply', clarRepErr);
    return NextResponse.json({
      ok: true,
      kind: 'clarification_response',
      base_step_id: baseStepId,
      messages: [
        { role: 'candidate', kind: 'clarification', text: message },
        { role: 'ai', kind: 'clarification_response', text: ai.reply },
      ],
    });
  }

  if (ai.kind === 'follow_up') {
    // Guard: if we're already at the limit, force a close instead.
    if (followUpsSoFar >= maxFollowUps) {
      ai.kind = 'close_block';
      ai.grade = ai.grade || 'B';
      ai.feedback = ai.feedback || 'Closing the block Ã¢ÂÂ follow-up limit reached.';
    } else {
      const { data: insertResult, error: insertErr } = await supabase.rpc('insert_followup_step', {
        p_interview_id: interviewId,
        p_parent_step_id: baseStepId,
        p_question: ai.follow_up_question,
      });
      if (insertErr) {
        console.error('[turn] insert_followup_step transport error', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      if (insertResult && (insertResult as { ok?: boolean }).ok === false) {
        console.error('[turn] insert_followup_step business error', { insertResult, baseStepId });
        return NextResponse.json({ error: 'insert_followup_step rejected', detail: insertResult }, { status: 500 });
      }
      const newStepId = (insertResult as { step_id?: string } | null)?.step_id ?? null;
      return NextResponse.json({
        ok: true,
        kind: 'follow_up',
        base_step_id: baseStepId,
        new_step_id: newStepId,
        messages: [
          { role: 'candidate', kind: 'answer', text: message },
          { role: 'ai', kind: 'follow_up', text: ai.follow_up_question, step_id: newStepId },
        ],
      });
    }
  }

  // close_block path
  const grade = ai.grade || 'B';
  const feedbackPayload = JSON.stringify({
    summary: ai.feedback,
    strengths: ai.strengths,
    weaknesses: ai.weaknesses,
  });
  const { data: gradeResult, error: gradeErr } = await supabase.rpc('apply_ai_grade', {
    p_step_id: baseStepId,
    p_grade: grade,
    p_feedback: feedbackPayload,
  });
  if (gradeErr) {
    console.error('[turn] apply_ai_grade transport error', gradeErr);
    return NextResponse.json({ error: gradeErr.message }, { status: 500 });
  }
  if (gradeResult && (gradeResult as { ok?: boolean }).ok === false) {
    console.error('[turn] apply_ai_grade business error', { gradeResult, grade, baseStepId });
    return NextResponse.json({ error: 'apply_ai_grade rejected', detail: gradeResult }, { status: 500 });
  }

  // Determine the next base step (next non-follow-up question by order_index).
  const { data: allSteps } = await supabase
    .from('interview_steps')
    .select('id, order_index, is_follow_up, parent_step_id, ai_status, ai_grade')
    .eq('interview_id', interviewId)
    .order('order_index', { ascending: true });
  const baseSteps = (allSteps ?? []).filter((s: any) => !s.is_follow_up);
  const currentIdx = baseSteps.findIndex((s: any) => s.id === baseStepId);
  const nextBase = currentIdx >= 0 ? baseSteps[currentIdx + 1] ?? null : null;
  const isLast = !nextBase;

  return NextResponse.json({
    ok: true,
    kind: 'close_block',
    base_step_id: baseStepId,
    next_base_step_id: nextBase?.id ?? null,
    is_last: isLast,
    messages: [
      { role: 'candidate', kind: 'answer', text: message },
      { role: 'ai', kind: 'close_block', text: ai.feedback },
    ],
  });
}
