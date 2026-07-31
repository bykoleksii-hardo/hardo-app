import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { chatJSON, OpenAIError } from '@/lib/openai';
import { withLogging, logger } from '@/lib/observability';
import { rateLimitTake, rateLimitSubject, rateLimitedResponse } from '@/lib/rate-limit';
import {
  FINALIZE_SYSTEM_PROMPT,
  FINALIZE_SCHEMA,
  FINALIZE_TEMPERATURE,
  aggregateBlockScore,
  type FinalizeAIResult,
} from '@/lib/interview-prompts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withLogging('POST /api/interview/finalize', async (req: Request, ctx: { requestId: string }) => {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Finalize triggers an LLM call — cap it per user (it was previously unbounded).
  const rl = await rateLimitTake(rateLimitSubject({ userId: user.id }), { bucket: 'interview.finalize', capacity: 12, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitedResponse(rl);

  const body = (await req.json().catch(() => null)) as { interviewId?: string } | null;
  if (!body?.interviewId) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, candidate_level, status, total_questions')
    .eq('id', body.interviewId)
    .eq('user_id', user.id)
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
    .select('id, order_index, is_follow_up, parent_step_id, custom_question, ai_grade, ai_feedback, user_answer, score_numeric, questions(question, category, subtopic)')
    .eq('interview_id', interview.id)
    .order('order_index', { ascending: true });
  type S = {
    id: string; order_index: number; is_follow_up: boolean; parent_step_id: string | null;
    custom_question: string | null; ai_grade: string | null; ai_feedback: string | null;
    user_answer: string | null; score_numeric: number | null;
    questions: { question: string; category: string; subtopic: string | null } | null;
  };
  const steps = (stepsRaw ?? []) as unknown as S[];
  const baseSteps = steps.filter(s => !s.is_follow_up);
  // Don't burn an LLM call finalizing an empty / not-yet-started interview.
  if (baseSteps.length === 0) {
    return NextResponse.json({ error: 'nothing to finalize' }, { status: 400 });
  }

  const RUBRIC_AXES = ['correctness', 'depth', 'structure', 'communication'] as const;
  const axisSums: Record<string, number> = { correctness: 0, depth: 0, structure: 0, communication: 0 };
  let axisN = 0;

  // Deterministic overall score: aggregate each block's per-answer numeric
  // scores (base + follow-ups, budget-capped) and average the block
  // percentages. The LLM echoes this number instead of inventing its own;
  // null when no block has numeric scores (legacy interviews).
  const blockPcts: number[] = [];

  const lines: string[] = [
    `Candidate level: ${interview.candidate_level}`,
    `Total base questions: ${baseSteps.length}`,
    ``,
    `PER-BLOCK BREAKDOWN:`,
  ];
  for (const b of baseSteps) {
    const q = b.questions?.question ?? '(unknown question)';
    const cat = b.questions?.category ?? '';
    const blockFollowUps = steps.filter(s => s.parent_step_id === b.id && s.is_follow_up);
    const agg = aggregateBlockScore(
      [b.score_numeric, ...blockFollowUps.map(f => f.score_numeric)],
      cat === 'Case Study',
    );
    if (agg) blockPcts.push(agg.pct);
    lines.push(`\nBlock ${b.order_index} [${cat}] grade=${b.ai_grade ?? '-'}${agg ? ` score=${agg.total}/${agg.budget}` : ''}`);
    lines.push(`Q: ${q}`);
    if (b.user_answer) lines.push(`A: ${b.user_answer.slice(0, 600)}`);
    // Surface the rubric axes (0-4) for this block and fold them into the aggregate.
    if (b.ai_feedback) {
      try {
        const fb = JSON.parse(b.ai_feedback) as { rubric?: Record<string, number> };
        const r = fb.rubric;
        if (r && RUBRIC_AXES.every(k => typeof r[k] === 'number' && Number.isFinite(r[k]))) {
          lines.push(`Rubric (0-4): correctness ${r.correctness}, depth ${r.depth}, structure ${r.structure}, communication ${r.communication}`);
          for (const k of RUBRIC_AXES) axisSums[k] += r[k];
          axisN++;
        }
      } catch { /* legacy / non-JSON feedback */ }
      lines.push(`Feedback: ${b.ai_feedback.slice(0, 400)}`);
    }
    for (const f of blockFollowUps) {
      lines.push(`  - FU: ${(f.custom_question ?? '').slice(0, 200)}`);
      if (f.user_answer) lines.push(`    A: ${f.user_answer.slice(0, 400)}`);
    }
  }

  const serverScore = blockPcts.length > 0
    ? Math.max(0, Math.min(100, Math.round((blockPcts.reduce((a, b) => a + b, 0) / blockPcts.length) * 100)))
    : null;
  if (serverScore != null) {
    lines.push(``, `SERVER-COMPUTED OVERALL SCORE: ${serverScore} / 100 (deterministic aggregate of the per-block numeric scores - echo this as overall_score and map hire_recommendation per the bands)`);
  }

  // Interview-wide skill profile (averaged axes) so the verdict + next steps can
  // target the candidate's weakest dimension by name.
  if (axisN > 0) {
    const avg = (k: string) => (axisSums[k] / axisN).toFixed(1);
    const weakest = [...RUBRIC_AXES].sort((a, b) => axisSums[a] - axisSums[b])[0];
    lines.push(
      ``,
      `SKILL PROFILE (avg of ${axisN} block rubrics, 0-4): correctness ${avg('correctness')}, depth ${avg('depth')}, structure ${avg('structure')}, communication ${avg('communication')}. Weakest axis: ${weakest}.`,
    );
  }

  let ai: FinalizeAIResult;
  let tokens = 0;
  try {
    const out = await chatJSON<FinalizeAIResult>({
      schemaName: 'hardo_finalize',
      schema: FINALIZE_SCHEMA,
      temperature: FINALIZE_TEMPERATURE,
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
      logger.error('[finalize] openai error', undefined, { status: e.status, code: e.code, type: e.type, message: e.message, raw: e.rawBody });
      return NextResponse.json({ friendly: e.friendly }, { status: 502 });
    }
    logger.error('[finalize] openai error (unknown)', e);
    return NextResponse.json({ friendly: 'The interviewer is unavailable right now. Please try again later.' }, { status: 502 });
  }

  // The server-computed aggregate wins when available; the LLM's number is only
  // trusted for legacy interviews with no numeric block scores.
  const score = serverScore ?? Math.max(0, Math.min(100, Math.round(ai.overall_score)));

  // Enforce score->recommendation consistency: the recommendation may sit at
  // most ONE band below the score's band (a named disqualifying moment), never
  // above it.
  const bandFor = (s: number): FinalizeAIResult['hire_recommendation'] =>
    s >= 75 ? 'hire' : s >= 60 ? 'leaning_hire' : s >= 40 ? 'leaning_no_hire' : 'no_hire';
  const BAND_ORDER: FinalizeAIResult['hire_recommendation'][] = ['no_hire', 'leaning_no_hire', 'leaning_hire', 'hire'];
  let hireRec = ai.hire_recommendation;
  {
    const band = bandFor(score);
    const bi = BAND_ORDER.indexOf(band);
    const ri = BAND_ORDER.indexOf(hireRec);
    if (ri === -1 || ri > bi || bi - ri > 1) {
      if (hireRec !== band) logger.warn('[finalize] hire_recommendation inconsistent with score band - overriding', { score, band, aiRec: ai.hire_recommendation });
      hireRec = band;
    }
  }

  const { data: inserted, error: insErr } = await supabase
    .from('interview_summaries')
    .insert({
      interview_id: interview.id,
      overall_score: score,
      overall_strengths: ai.overall_strengths,
      overall_weaknesses: ai.overall_weaknesses,
      final_feedback: JSON.stringify({
        summary: ai.final_feedback,
        next_steps_plan: Array.isArray(ai.next_steps_plan) ? ai.next_steps_plan : [],
        weakest_block_label: ai.weakest_block_label ?? '',
        strongest_moment: ai.strongest_moment ?? '',
      }),
      hire_recommendation: hireRec,
      tokens_used: tokens,
    })
    .select('id')
    .maybeSingle();
  if (insErr) {
    logger.error('[finalize] insert summary error', insErr);
    return NextResponse.json({ error: 'Could not save your scorecard. Please try again.' }, { status: 500 });
  }

  await supabase
    .from('interviews')
    .update({ status: 'completed', finished_at: new Date().toISOString(), final_score: score })
    .eq('id', interview.id);

  logger.info('interview finalized', { requestId: ctx.requestId, userId: user.id, interviewId: interview.id, overallScore: score });
  return NextResponse.json({
    ok: true,
    summary_id: inserted?.id ?? null,
    overall_score: score,
  });
});
