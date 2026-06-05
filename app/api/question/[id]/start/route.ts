import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { withLogging, logger } from '@/lib/observability';

// POST /api/question/[id]/start
// Launches a single-question "deep dive" session from the Question Vault.
// Reuses the standard interview engine (state / turn / finalize) but creates an
// interview row with kind = 'deep_dive' so it does NOT consume the free-interview
// quota and is excluded from profile stats. The deep dive runs the question with
// case-style depth (up to 5 follow-ups) - that branching lives in /api/interview/turn,
// which treats kind = 'deep_dive' the same as a case study.
//
// Access:
//   - not authenticated             -> 401 (client redirects to /login)
//   - authenticated, not subscribed  -> 403 { reason: 'upgrade_required' } (client -> /pricing)
//   - authenticated, question locked  -> 403 { reason: 'locked' }
//   - subscribed + unlocked          -> 200 { interview_id }
export const POST = withLogging('POST /api/question/[id]/start', async (
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
  logCtx: { requestId: string },
) => {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id: idStr } = await ctx.params;
  const questionId = Number(idStr);
  if (!Number.isInteger(questionId) || questionId <= 0) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  // 1. Gate on active subscription via the canonical quota RPC.
  const { data: quota, error: quotaErr } = await supabase.rpc('get_user_quota_status');
  if (quotaErr) {
    logger.error('deep_dive: quota check failed', quotaErr);
    return NextResponse.json({ error: 'quota check failed' }, { status: 500 });
  }
  const isPaid = (quota as { is_paid?: boolean } | null)?.is_paid === true;
  if (!isPaid) {
    return NextResponse.json(
      { error: 'The Question Vault deep dive is available on the paid plan.', reason: 'upgrade_required' },
      { status: 403 },
    );
  }

  // 2. The question must be unlocked: the user has encountered it in a prior interview.
  const { data: exposure } = await supabase
    .from('question_exposure')
    .select('question_id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .maybeSingle();
  if (!exposure) {
    return NextResponse.json(
      { error: 'This question is still locked. Encounter it in an interview to unlock it.', reason: 'locked' },
      { status: 403 },
    );
  }

  // 3. Load the question to pick a sensible candidate level for the persona.
  const { data: question } = await supabase
    .from('questions')
    .select('id, candidate_level, question')
    .eq('id', questionId)
    .maybeSingle();
  if (!question) {
    return NextResponse.json({ error: 'question not found' }, { status: 404 });
  }
  const rawLevel = (question as { candidate_level?: string | null }).candidate_level ?? 'analyst';
  const level = ['intern', 'analyst', 'associate'].includes(rawLevel) ? rawLevel : 'analyst';

  // 4. Create the deep-dive interview shell (RLS: user_id = auth.uid()).
  const { data: interview, error: ivErr } = await supabase
    .from('interviews')
    .insert({
      user_id: user.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      candidate_level: level,
      total_questions: 1,
      total_followups: 0,
      kind: 'deep_dive',
    })
    .select('id')
    .maybeSingle();
  if (ivErr || !interview) {
    logger.error('deep_dive: failed to create interview', ivErr);
    return NextResponse.json({ error: ivErr?.message ?? 'failed to create session' }, { status: 500 });
  }

  // 5. Seed the single base step for this question.
  const { error: stepErr } = await supabase
    .from('interview_steps')
    .insert({
      interview_id: interview.id,
      question_id: questionId,
      order_index: 0,
      is_follow_up: false,
      ai_decision: 'deep_dive_seed',
      ai_reason: 'deep dive: single-question session (up to 5 follow-ups)',
      delivered_question: (question as { question?: string | null }).question ?? null,
    });
  if (stepErr) {
    logger.error('deep_dive: failed to seed step', stepErr);
    return NextResponse.json({ error: stepErr.message }, { status: 500 });
  }

  logger.info('deep dive started', { requestId: logCtx.requestId, userId: user.id, questionId: String(questionId), interviewId: interview.id });
  return NextResponse.json({ interview_id: interview.id });
});
