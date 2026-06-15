import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { chatJSON, OpenAIError } from '@/lib/openai';
import {
  TURN_SYSTEM_PROMPT,
  TURN_SCHEMA,
  buildTurnUserPrompt,
  aggregateBlockScore,
  maxScoreForTurn,
  ADVANCE_THRESHOLD,
  rubricKindForCategory,
  rubricToPct,
  isValidRubric,
  percentToLetter,
  normalizeAiGrade,
  GRADING_TEMPERATURE,
  type TurnAIResult,
  type TurnContext,
} from '@/lib/interview-prompts';
import { getTimeLimitSeconds } from '@/lib/timer-config';
import { sanitizeDelivery, aggregateDelivery, formatDeliveryForPrompt, type DeliveryMetrics } from '@/lib/delivery';
import { withLogging } from '@/lib/observability';
import { rateLimitTake, rateLimitSubject, rateLimitedResponse } from '@/lib/rate-limit';
import { tooLong, LIMITS } from '@/lib/validation';

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
  interviews: { candidate_level: string; total_questions: number | null; input_mode: string | null; kind: string | null; user_id: string } | null;
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

  const rl = await rateLimitTake(rateLimitSubject({ userId: user.id }), { bucket: 'interview.turn', capacity: 60, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitedResponse(rl);

  const body = (await req.json().catch(() => null)) as { stepId?: string; message?: string; delivery?: unknown } | null;
  if (!body?.stepId || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  // Voice delivery metrics for the answer just submitted (best-effort, sanitized).
  const currentDelivery: DeliveryMetrics | null = sanitizeDelivery(body.delivery);
  const message = body.message.trim();
  if (message.length < 1) {
    return NextResponse.json({ error: 'message empty' }, { status: 400 });
  }
  if (tooLong(message, LIMITS.ANSWER)) {
    return NextResponse.json({ error: 'message too long' }, { status: 400 });
  }

  // 1. Resolve the step. The "active" step from the client is the BASE step of the block.
  //    If it is itself a follow-up, walk up to its parent so we always grade at the block root.
  const { data: rawStep, error: stepErr } = await supabase
    .from('interview_steps')
    .select('id, interview_id, is_follow_up, parent_step_id, custom_question, order_index, created_at, questions(id, question, category, subtopic, difficulty), interviews(candidate_level, total_questions, input_mode, kind, user_id)')
    .eq('id', body.stepId)
    .maybeSingle();
  if (stepErr || !rawStep) {
    return NextResponse.json({ error: 'step not found' }, { status: 404 });
  }
  let step = rawStep as unknown as StepRow;
  // Defence-in-depth ownership check (don't rely on RLS alone for this write path).
  if (!step.interviews || step.interviews.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (step.is_follow_up && step.parent_step_id) {
    const { data: parent } = await supabase
      .from('interview_steps')
      .select('id, interview_id, is_follow_up, parent_step_id, custom_question, order_index, created_at, questions(id, question, category, subtopic, difficulty), interviews(candidate_level, total_questions, input_mode, kind, user_id)')
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
  const isCase = category.toLowerCase() === 'case study' || step.interviews?.kind === 'deep_dive';
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

  // 4b. Derive interview stage context (question number + prior topics) for opener variation.
  const { data: siblingSteps } = await supabase
    .from('interview_steps')
    .select('order_index, questions(category)')
    .eq('interview_id', interviewId)
    .eq('is_follow_up', false)
    .order('order_index', { ascending: true });
  const allBaseSteps = siblingSteps ?? [];
  const currentOrderIndex = (allBaseSteps.find((s: { order_index: number }) => s.order_index === (rawStep as { order_index: number }).order_index) ?? allBaseSteps[allBaseSteps.length - 1]) as { order_index: number; questions?: { category?: string } | null };
  const questionNumber = allBaseSteps.findIndex((s: { order_index: number }) => s.order_index === (rawStep as { order_index: number }).order_index) + 1 || allBaseSteps.length;
  const priorTopics = allBaseSteps
    .slice(0, Math.max(0, questionNumber - 1))
    .map((s) => (s.questions as { category?: string } | null)?.category)
    .filter((c: string | undefined): c is string => !!c);

  // 4c. Aggregate this block's voice delivery so far (prior persisted answers +
  // the current one) to ground the Communication rubric axis. Best-effort and
  // tolerant of the delivery_metrics column not existing yet.
  let deliverySummary: string | undefined;
  try {
    const priorIds = [baseStepId, ...children.map(c => c.id)].filter(id => id !== currentStepId);
    let prior: DeliveryMetrics[] = [];
    if (priorIds.length > 0) {
      const { data: dRows, error: dErr } = await supabase
        .from('interview_steps').select('id, delivery_metrics').in('id', priorIds);
      if (!dErr && Array.isArray(dRows)) {
        prior = dRows.map(r => sanitizeDelivery((r as { delivery_metrics?: unknown }).delivery_metrics)).filter((d): d is DeliveryMetrics => !!d);
      }
    }
    const blockDelivery = aggregateDelivery([...prior, currentDelivery]);
    if (blockDelivery) deliverySummary = formatDeliveryForPrompt(blockDelivery);
  } catch { /* delivery is optional grounding */ }

  // 5. Call OpenAI with structured output.
  let ai: TurnAIResult;
  try {
    const out = await chatJSON<TurnAIResult>({
      schemaName: 'hardo_turn',
      schema: TURN_SCHEMA,
      temperature: GRADING_TEMPERATURE,
      maxTokens: 1500,
      messages: [
        { role: 'system', content: TURN_SYSTEM_PROMPT },
        { role: 'user', content: buildTurnUserPrompt({
          level, category, subtopic, difficulty,
          isCase, rubricKind: rubricKindForCategory(category),
          followUpsSoFar, maxFollowUps,
          maxScoreForThisTurn: maxScoreForTurn(followUpsSoFar, isCase),
          question: baseQuestion,
          transcript,
          candidateMessage: message,
          deliverySummary,
          questionNumber,
          priorTopics,
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
      return NextResponse.json({ friendly: e.friendly }, { status: 502 });
    }
    console.error('[turn] openai error (unknown)', e);
    return NextResponse.json({ friendly: 'The interviewer is unavailable right now. Please try again later.' }, { status: 502 });
  }

  // Decision rule enforcement (Phase E.1 - force full block depth on strong answers).
  // The AI returns a numeric score and a proposed kind. The server enforces:
  //   - score < 30% of MAX_SCORE_FOR_THIS_TURN -> force close_block (advance threshold).
  //   - already at follow-up limit -> force close_block.
  //   - AI emitted close_block at score >= 30% with budget remaining -> OVERRIDE to follow_up.
  //     Rationale: on >=30% answers the AI must keep drilling (deepen or rebuild) until the
  //     block reaches its full depth (normal: base+2FU; case: base+5FU). Closing early would
  //     leave remaining sub-turns at 0 points and unfairly cap the candidate's score.
  // Skipped entirely for clarification_response.
  if (ai.message_type === 'answer') {
    const turnMax = maxScoreForTurn(followUpsSoFar, isCase);
    // Clamp the score into [0, turnMax] just in case the model exceeded the range.
    const rawScore = typeof (ai as any).current_answer_score === 'number'
      ? (ai as any).current_answer_score
      : 0;
    const cas = Math.max(0, Math.min(turnMax, Math.round(rawScore)));
    (ai as any).current_answer_score = cas;
    const pct = turnMax > 0 ? cas / turnMax : 0;
    const belowAdvance = pct < ADVANCE_THRESHOLD;
    const atLimit = followUpsSoFar >= maxFollowUps;
    const emptyFollowUp = ai.kind === 'follow_up' && (!ai.follow_up_question || !String(ai.follow_up_question).trim());
    if (belowAdvance || atLimit || emptyFollowUp) {
      // Force close_block - either too weak or no follow-ups left.
      ai.kind = 'close_block';
      console.warn('[turn] forcing close_block', { reason: belowAdvance ? 'below_advance_threshold' : 'fu_limit_reached', score: cas, turnMax, pct, followUpsSoFar, maxFollowUps, baseStepId });
      if (!ai.feedback || !String(ai.feedback).trim()) {
        ai.feedback = belowAdvance
          ? 'Closing the block here - the latest answer did not give enough signal to drill deeper.'
          : 'Closing the block - follow-up limit reached.';
      }
    } else if (ai.kind === 'close_block') {
      // AI tried to close early on a >=30% answer with FU budget remaining.
      // Override to follow_up - the block must continue to its full depth.
      // The AI's prompt forbids this, but we enforce here as a safety net.
      console.warn('[turn] overriding AI close_block to follow_up', { reason: 'strong_answer_with_budget', score: cas, turnMax, pct, followUpsSoFar, maxFollowUps, baseStepId });
      ai.kind = 'follow_up';
      if (!ai.follow_up_question || !String(ai.follow_up_question).trim()) {
        console.error('[turn] CRITICAL: AI emitted close_block at >=30% with no follow_up_question - prompt drift');
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
    // Persist voice delivery for this answer separately (best-effort): if the
    // delivery_metrics column doesn't exist yet this fails harmlessly and the
    // critical answer write above is unaffected.
    if (currentDelivery) {
      const { error: dErr } = await supabase
        .from('interview_steps')
        .update({ delivery_metrics: currentDelivery })
        .eq('id', currentStepId);
      if (dErr) console.warn('[turn] delivery_metrics persist skipped', dErr.message);
    }
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
    // Phase E: save the per-answer NUMERIC score for the step the candidate just answered.
    const cas = (ai as any).current_answer_score;
    if (typeof cas === 'number' && Number.isFinite(cas)) {
      const { error: casErr } = await supabase
        .from('interview_steps')
        .update({ score_numeric: cas })
        .eq('id', currentStepId);
      if (casErr) console.warn('[turn] failed to persist current_answer_score on follow_up', casErr);
    }
    // Defense in depth: should already be caught by the Phase E guard above.
    if (followUpsSoFar >= maxFollowUps) {
      ai.kind = 'close_block';
      if (!ai.feedback || !String(ai.feedback).trim()) {
        ai.feedback = 'Closing the block - follow-up limit reached.';
      }
    } else {
      const { data: insertResult, error: insertErr } = await supabase.rpc('insert_followup_step', {
        p_interview_id: interviewId,
        p_parent_step_id: baseStepId,
        p_question: ai.follow_up_question,
      });
      if (insertErr) {
        console.error('[turn] insert_followup_step transport error', insertErr);
        return NextResponse.json({ error: 'Could not continue the interview. Please try again.' }, { status: 500 });
      }
      if (insertResult && (insertResult as { ok?: boolean }).ok === false) {
        console.error('[turn] insert_followup_step business error', { insertResult, baseStepId });
        return NextResponse.json({ error: 'Could not continue the interview. Please try again.' }, { status: 500 });
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

  // close_block path (Phase E: numeric per-answer scoring + server-side aggregation)
  // 7c.1. Persist the per-answer NUMERIC score for the step the candidate just answered.
  const lastScore = (ai as any).current_answer_score;
  if (typeof lastScore === 'number' && Number.isFinite(lastScore)) {
    const { error: lastScoreErr } = await supabase
      .from('interview_steps')
      .update({ score_numeric: lastScore })
      .eq('id', currentStepId);
    if (lastScoreErr) console.warn('[turn] failed to persist current_answer_score on close_block', lastScoreErr);
  }

  // 7c.2. Aggregate per-answer scores across the whole block (base + all follow-ups).
  const { data: blockSteps } = await supabase
    .from('interview_steps')
    .select('id, is_follow_up, parent_step_id, order_index, score_numeric, created_at')
    .or(`id.eq.${baseStepId},parent_step_id.eq.${baseStepId}`)
    .order('created_at', { ascending: true });

  const orderedScores: Array<number | null> = [];
  const baseRow = (blockSteps || []).find((r: any) => r.id === baseStepId);
  // base first
  if (baseRow) {
    if (currentStepId === baseStepId && typeof lastScore === 'number') {
      orderedScores.push(lastScore);
    } else if (typeof baseRow.score_numeric === 'number') {
      orderedScores.push(baseRow.score_numeric);
    } else {
      orderedScores.push(null);
    }
  }
  // then follow-ups in chronological order
  const fuRows = (blockSteps || []).filter((r: any) => r.is_follow_up && r.parent_step_id === baseStepId);
  for (const fu of fuRows) {
    if (fu.id === currentStepId && typeof lastScore === 'number') {
      orderedScores.push(lastScore);
    } else if (typeof fu.score_numeric === 'number') {
      orderedScores.push(fu.score_numeric);
    } else {
      orderedScores.push(null);
    }
  }

  const aggregate = aggregateBlockScore(orderedScores, isCase);

  // 7c.2a. Aggregate the block's voice delivery for the scorecard (best-effort).
  let blockDelivery: DeliveryMetrics | null = null;
  try {
    const ids = (blockSteps || []).map((r: any) => r.id).filter((id: string) => id !== currentStepId);
    let prior: DeliveryMetrics[] = [];
    if (ids.length > 0) {
      const { data: dRows } = await supabase.from('interview_steps').select('id, delivery_metrics').in('id', ids);
      if (Array.isArray(dRows)) prior = dRows.map(r => sanitizeDelivery((r as { delivery_metrics?: unknown }).delivery_metrics)).filter((d): d is DeliveryMetrics => !!d);
    }
    blockDelivery = aggregateDelivery([...prior, currentDelivery]);
  } catch { /* delivery optional */ }

  // 7c.2b. Block grade = blend of the holistic close_block RUBRIC (primary) and a
  // deterministic per-answer component where the base answer counts more than the
  // follow-ups (base max 30, each follow-up max 15 -> base ~2x a follow-up). The
  // per-answer component is normalized over the turns ACTUALLY taken, so the
  // engine asking fewer follow-ups does not by itself lower the grade.
  const RUBRIC_WEIGHT = 0.7;
  const ANSWER_WEIGHT = 0.3;
  const rubricKind = rubricKindForCategory(category);
  const aiRubric = (ai as { rubric?: unknown }).rubric;
  const rubricPct: number | null = isValidRubric(aiRubric) ? rubricToPct(aiRubric, rubricKind, level) : null;

  // Weighted per-answer %: sum(scores) / sum(max per answered turn). Base turn
  // max is 30, each follow-up 15, so the base answer carries the most weight.
  let scoreSum = 0;
  let maxSum = 0;
  orderedScores.forEach((s, i) => {
    if (typeof s === 'number' && Number.isFinite(s)) { scoreSum += s; maxSum += maxScoreForTurn(i, isCase); }
  });
  const perAnswerPct: number | null = maxSum > 0 ? Math.max(0, Math.min(1, scoreSum / maxSum)) : null;

  let blockPct: number | null;
  if (rubricPct != null && perAnswerPct != null) blockPct = RUBRIC_WEIGHT * rubricPct + ANSWER_WEIGHT * perAnswerPct;
  else blockPct = rubricPct ?? perAnswerPct;

  const rawGrade: string = blockPct != null ? percentToLetter(blockPct) : (aggregate?.letter || 'B');
  if (rubricPct == null) console.warn('[turn] missing/invalid rubric on close_block; graded from per-answer only', { baseStepId, aiRubric });
  // Coerce to the DB-accepted whitelist (apply_ai_grade + interview_steps CHECK
  // reject anything else, e.g. 'A+'). percentToLetter already stays in-set; this
  // guard guarantees the grade write can never be rejected on the grade value.
  const grade = normalizeAiGrade(rawGrade);
  if (grade !== rawGrade) console.warn('[turn] normalized out-of-set grade', { baseStepId, rawGrade, grade });
  console.log('[turn] block grade', { baseStepId, rubricKind, rubricPct, perAnswerPct, blockPct, finalGrade: grade, perAnswer: orderedScores });

  // 7c.3. Build feedback payload (rubric + per-answer scores + blended grade).
  const feedbackPayload = JSON.stringify({
    summary: ai.feedback,
    strengths: ai.strengths,
    weaknesses: ai.weaknesses,
    detail: ai.feedback_detail ?? null,
    rubric: isValidRubric(aiRubric) ? aiRubric : null,
    rubric_kind: rubricKind,
    rubric_pct: rubricPct,
    per_answer_pct: perAnswerPct,
    block_pct: blockPct,
    grade_weights: { rubric: RUBRIC_WEIGHT, answers: ANSWER_WEIGHT },
    per_answer_scores: orderedScores,
    aggregate_total: aggregate?.total ?? null,
    aggregate_budget: aggregate?.budget ?? null,
    aggregate_pct: aggregate?.pct ?? null,
    delivery: blockDelivery,
    is_case: isCase,
  });

  // 7c.4. Persist the aggregate letter as the block grade via apply_ai_grade.
  const { data: gradeResult, error: gradeErr } = await supabase.rpc('apply_ai_grade', {
    p_step_id: baseStepId,
    p_grade: grade,
    p_feedback: feedbackPayload,
  });
  if (gradeErr) {
    console.error('[turn] apply_ai_grade transport error', gradeErr);
    return NextResponse.json({ error: 'Could not save your grade. Please try again.' }, { status: 500 });
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
