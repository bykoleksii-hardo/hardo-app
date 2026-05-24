import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { chatJSON, OpenAIError } from '@/lib/openai';
import {
  TURN_SYSTEM_PROMPT,
  TURN_SCHEMA,
  buildTurnUserPrompt,
  aggregateBlockGrade,
  type TurnAIResult,
  type TurnContext,
  type LetterGrade,
} from '@/lib/interview-prompts';
import { getTimeLimitSeconds } from '@/lib/timer-config';
import { withLogging } from '@/lib/observability';

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
  created_at: string | null;
  questions: {
    id: number;
    question: string;
    category: string;
    subtopic: string | null;
    difficulty: number | null;
  } | null;
  interviews: { candidate_level: string; total_questions: number | null; input_mode: string | null } | null;
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
  created_at: string | null;
};

export const POST = withLogging('POST /api/interview/turn', async (req: Request, _ctx: { requestId: string }) => {
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
    .select('id, interview_id, is_follow_up, parent_step_id, custom_question, order_index, created_at, questions(id, question, category, subtopic, difficulty), interviews(candidate_level, total_questions, input_mode)')
    .eq('id', body.stepId)
    .maybeSingle();
  if (stepErr || !rawStep) {
    return NextResponse.json({ error: stepErr?.message ?? 'step not found' }, { status: 404 });
  }
  let step = rawStep as unknown as StepRow;
  if (step.is_follow_up && step.parent_step_id) {
    const { data: parent } = await supabase
      .from('interview_steps')
      .select('id, interview_id, is_follow_up, parent_step_id, custom_question, order_index, created_at, questions(id, question, category, subtopic, difficulty), interviews(candidate_level, total_questions, input_mode)')
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
    .select('id, parent_step_id, is_follow_up, custom_question, order_index, user_answer, ai_feedback, created_at')
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
    // Consistency guard: kind=clarification_response REQUIRES message_type=clarification.
    // If the model returns kind=clarification_response with message_type=answer, the model is
    // confused about whether the candidate answered or asked. Trust the kind (model crafted a
    // clarifying reply) and downgrade message_type to 'clarification' so we do not advance.
    if (ai.kind === 'clarification_response' && ai.message_type === 'answer') {
      console.warn('[turn] inconsistent ai output: kind=clarification_response + message_type=answer; forcing message_type=clarification', { reply: ai.reply });
      ai.message_type = 'clarification';
    }
    // Symmetric guard: kind=close_block or follow_up REQUIRE message_type=answer (the candidate
    // gave a real answer). If model says message_type=clarification with these kinds, that's also
    // inconsistent - trust the kind (the model is grading or pushing) and force answer.
    if ((ai.kind === 'close_block' || ai.kind === 'follow_up') && ai.message_type === 'clarification') {
      console.warn('[turn] inconsistent ai output: kind=' + ai.kind + ' + message_type=clarification; forcing message_type=answer');
      ai.message_type = 'answer';
    }
  } catch (e) {
    if (e instanceof OpenAIError) {
      console.error('[turn] openai error', { status: e.status, code: e.code, type: e.type, message: e.message, raw: e.rawBody });
      return NextResponse.json({ error: e.message, code: e.code, friendly: e.friendly }, { status: 502 });
    }
    console.error('[turn] openai error (unknown)', e);
    return NextResponse.json({ error: (e as Error).message, friendly: 'The interviewer is unavailable right now. Please try again later.' }, { status: 502 });
  }

  // Decision rule enforcement (Phase C).
  // The AI is instructed to follow the decision rule, but we enforce it server-side too.
  // - If kind=follow_up but current_answer_grade is D-/F -> force close_block (no drill).
  // - If kind=close_block but follow-ups remain and current_answer_grade is >= D -> force follow_up
  //   (the AI tried to close early on a recoverable / strong answer; we want the ceiling test).
  // Skipped entirely for clarification_response.
  if (ai.message_type === 'answer') {
    const cag = (ai.current_answer_grade || ai.grade || '') as LetterGrade;
    // No drill on D-floor or worse: a candidate whose latest answer is D, D-, F has
    // already used the recovery probe (if this was a follow-up) or is not recoverable.
    // Pushing further would only frustrate them.
    const isLowFloor = cag === 'D+' || cag === 'D' || cag === 'D-' || cag === 'F';
    const hasRoom = followUpsSoFar < maxFollowUps;
    if (ai.kind === 'follow_up' && isLowFloor) {
      console.warn('[turn] forcing close_block: AI emitted follow_up on D-/F answer', { cag, baseStepId });
      ai.kind = 'close_block';
      ai.grade = cag || 'D';
      if (!ai.feedback) ai.feedback = 'Closing the block - the answer did not give enough signal to drill deeper.';
    } else if (ai.kind === 'close_block' && hasRoom && !isLowFloor && cag) {
      console.warn('[turn] forcing follow_up: AI closed early with room remaining and grade >= D', { cag, baseStepId, followUpsSoFar, maxFollowUps });
      ai.kind = 'follow_up';
      if (!ai.follow_up_question || !ai.follow_up_question.trim()) {
        // Best-effort fallback prompt. The persona-flavored generation would have been ideal but
        // the model already returned close_block; we still need a question to keep going.
        ai.follow_up_question = 'Can you go one level deeper on what you just said - either with a specific number, an edge case, or a real-world example?';
      }
    }
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
    // Resolve created_at of the actual step we are answering (base step or last unanswered follow-up).
    let stepCreatedAt: string | null = step.created_at;
    let stepCategory: string = category;
    let stepIsFollowUp = false;
    if (currentStepId !== baseStepId) {
      const cs = children.find(c => c.id === currentStepId);
      if (cs && cs.created_at) stepCreatedAt = cs.created_at;
      stepIsFollowUp = true;
    }
    const limitSec = getTimeLimitSeconds({ category: stepCategory, isFollowUp: stepIsFollowUp, inputMode: (step.interviews?.input_mode === 'voice' ? 'voice' : 'text') });
    let elapsedSec: number | null = null;
    if (stepCreatedAt) {
      const startMs = new Date(stepCreatedAt).getTime();
      const nowMs = Date.now();
      if (Number.isFinite(startMs) && nowMs > startMs) {
        elapsedSec = Math.round((nowMs - startMs) / 1000);
      }
    }
    const overtime = elapsedSec !== null && elapsedSec > limitSec;
    await supabase
      .from('interview_steps')
      .update({
        user_answer: message,
        answered_at: new Date().toISOString(),
        time_limit_seconds: limitSec,
        was_overtime: overtime,
      })
      .eq('id', currentStepId);
  }

  // 7. Branch on AI decision.
  if (ai.kind === 'clarification_response') {
    // Fallback: if AI returned empty reply, supply a generic prompt so candidate can continue
    if (!ai.reply || !String(ai.reply).trim()) {
      console.warn('[turn] empty clarification reply from AI; using fallback');
      ai.reply = 'Use your best interpretation of the question and proceed with your answer.';
    }
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
    // Phase C: save the per-answer grade for the step the candidate just answered.
    // currentStepId is either baseStepId (first turn) or a previous follow-up step id.
    if (ai.current_answer_grade) {
      const { error: cagErr } = await supabase
        .from('interview_steps')
        .update({ ai_grade: ai.current_answer_grade })
        .eq('id', currentStepId);
      if (cagErr) console.warn('[turn] failed to persist current_answer_grade on follow_up', cagErr);
    }
    // Guard: if we're already at the limit, force a close instead.
    if (followUpsSoFar >= maxFollowUps) {
      ai.kind = 'close_block';
      ai.grade = ai.grade || 'B';
      ai.feedback = ai.feedback || 'Closing the block ÃÂ¢ÃÂÃÂ follow-up limit reached.';
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

  // close_block path (Phase C: per-answer grading + server-side aggregation)
  // 7c.1. Persist the per-answer grade for the step the candidate just answered.
  if (ai.current_answer_grade) {
    const { error: lastGradeErr } = await supabase
      .from('interview_steps')
      .update({ ai_grade: ai.current_answer_grade })
      .eq('id', currentStepId);
    if (lastGradeErr) console.warn('[turn] failed to persist current_answer_grade on close_block', lastGradeErr);
  }

  // 7c.2. Aggregate per-answer grades across the whole block.
  // Pull base step grade + all follow-up grades in chronological order.
  const { data: blockSteps } = await supabase
    .from('interview_steps')
    .select('id, is_follow_up, parent_step_id, order_index, ai_grade, created_at')
    .or(`id.eq.${baseStepId},parent_step_id.eq.${baseStepId}`)
    .order('created_at', { ascending: true });
  const orderedGrades: string[] = [];
  // base first
  const baseRow = (blockSteps || []).find((r: any) => r.id === baseStepId);
  if (baseRow && baseRow.ai_grade) orderedGrades.push(baseRow.ai_grade);
  else if (!baseRow?.is_follow_up && ai.current_answer_grade && currentStepId === baseStepId) {
    // The base step's ai_grade is the one we just set above.
    orderedGrades.push(ai.current_answer_grade);
  }
  // then follow-ups in chronological order
  const fuRows = (blockSteps || []).filter((r: any) => r.is_follow_up && r.parent_step_id === baseStepId);
  for (const fu of fuRows) {
    if (fu.ai_grade) orderedGrades.push(fu.ai_grade);
    else if (fu.id === currentStepId && ai.current_answer_grade) {
      // The FU we just answered - its ai_grade was set above.
      orderedGrades.push(ai.current_answer_grade);
    }
  }

  const aggregate = aggregateBlockGrade(orderedGrades, isCase);
  // Fallback: if aggregate could not be computed, use ai.grade or 'B' (legacy behavior).
  const grade = aggregate?.grade || ai.grade || ai.current_answer_grade || 'B';
  console.log('[turn] block grade aggregate', { baseStepId, perAnswer: orderedGrades, isCase, aggregate, finalGrade: grade });

  // 7c.3. Build feedback payload (now includes the per-answer grades + numeric aggregate).
  const feedbackPayload = JSON.stringify({
    summary: ai.feedback,
    strengths: ai.strengths,
    weaknesses: ai.weaknesses,
    detail: ai.feedback_detail ?? null,
    per_answer_grades: orderedGrades,
    aggregate_numeric: aggregate?.numeric ?? null,
    is_case: isCase,
  });

  // 7c.4. Persist the aggregate as the block grade via apply_ai_grade (which also sets ai_status=done).
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

  // Reset timer for the next base step: bump its created_at to now so the candidate sees a fresh clock.
  if (nextBase?.id) {
    await supabase
      .from('interview_steps')
      .update({ created_at: new Date().toISOString() })
      .eq('id', nextBase.id);
  }

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
});
