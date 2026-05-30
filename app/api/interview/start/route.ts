import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { withLogging, logger } from '@/lib/observability';
import { chatJSON } from '@/lib/openai';
import {
  REPHRASE_SYSTEM_PROMPT,
  REPHRASE_SCHEMA,
  buildRephrasePrompt,
  type CandidateProfileSnapshot,
  type RephraseAIResult,
  type Level,
} from '@/lib/interview-prompts';

export const POST = withLogging('POST /api/interview/start', async (req: Request, ctx: { requestId: string }) => {
  try {
    const { level, input_mode: inputModeRaw } = await req.json();
    if (!['intern', 'analyst', 'associate'].includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }
    const inputMode: 'text' | 'voice' = inputModeRaw === 'voice' ? 'voice' : 'text';

    const supabase = await getSupabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // --- Gating ---
    const { data: quota, error: quotaErr } = await supabase.rpc('get_user_quota_status');
    if (quotaErr) {
      logger.error('get_user_quota_status error', quotaErr);
      return NextResponse.json({ error: 'Quota check failed' }, { status: 500 });
    }
    const q = quota as {
      plan: 'free' | 'paid';
      interviews_used: number;
      free_limit: number;
      allowed_levels: string[];
      can_start: boolean;
    };
    if (!q.allowed_levels.includes(level)) {
      return NextResponse.json(
        { error: 'This level is available on the paid plan only.', reason: 'level_locked', plan: q.plan },
        { status: 403 }
      );
    }
    if (!q.can_start) {
      return NextResponse.json(
        {
          error: 'You have used your free interview. Upgrade to continue.',
          reason: 'free_limit_reached',
          plan: q.plan,
          interviews_used: q.interviews_used,
          free_limit: q.free_limit,
        },
        { status: 403 }
      );
    }
    // --- End gating ---

    const { data, error } = await supabase.rpc('start_interview', { p_level: level });
    if (error) {
      logger.error('start_interview RPC error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Persist input_mode (default 'text'). RLS allows the owner to update their own interview row.
    if (inputMode !== 'text' && typeof data === 'string') {
      const { error: modeErr } = await supabase
        .from('interviews')
        .update({ input_mode: inputMode })
        .eq('id', data);
      if (modeErr) logger.error('start: failed to set input_mode', modeErr);
    }

    // --- Phase B: AI rephrase of base questions into the interviewer's voice ---
    // Best-effort. Failures are logged but do not block the interview start - the
    // client falls back to questions.question when delivered_question is null.
    if (typeof data === 'string') {
      try {
        await rephraseBaseQuestions(supabase, data, level as Level, user.id);
      } catch (e) {
        // Non-fatal: client falls back to raw question text.
        logger.error('start: rephrase orchestration failed (non-fatal)', e);
      }
    }

    logger.info('interview started', { requestId: ctx.requestId, userId: user.id, interviewId: data, inputMode });
    return NextResponse.json({ interview_id: data, input_mode: inputMode });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
});


// ---------------------------------------------------------------
// Rephrase orchestration (Phase B)
// ---------------------------------------------------------------
// Fetches the freshly-created base steps for this interview, looks up their
// raw question text and the candidate's profile, then calls the LLM in
// parallel to produce delivered_question for each base step. Results are
// persisted with per-step UPDATEs (failures are isolated per step).
async function rephraseBaseQuestions(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  interviewId: string,
  level: Level,
  userId: string,
): Promise<void> {
  // 1. Pull base steps (is_follow_up = false) with the FK question.
  const { data: stepsRaw, error: stepsErr } = await supabase
    .from('interview_steps')
    .select('id, order_index, question_id, delivered_question, questions(question, category, subtopic)')
    .eq('interview_id', interviewId)
    .eq('is_follow_up', false)
    .order('order_index', { ascending: true });
  if (stepsErr || !stepsRaw) {
    logger.error('rephrase: failed to load steps', stepsErr);
    return;
  }
  type StepRow = {
    id: string;
    order_index: number;
    question_id: number | null;
    delivered_question: string | null;
    questions: { question: string; category: string; subtopic: string | null } | null;
  };
  const steps = stepsRaw as unknown as StepRow[];

  // 2. Pull profile snapshot once.
  const { data: profileRaw } = await supabase
    .from('user_profiles')
    .select('preferred_name, first_name, current_position, university, major, graduation_year, interview_region, country, cv_summary, bio, use_in_persona')
    .eq('user_id', userId)
    .maybeSingle();
  const profile: CandidateProfileSnapshot | null = profileRaw
    ? {
        preferred_name: profileRaw.preferred_name ?? null,
        first_name: profileRaw.first_name ?? null,
        current_position: profileRaw.current_position ?? null,
        university: profileRaw.university ?? null,
        major: profileRaw.major ?? null,
        graduation_year: profileRaw.graduation_year ?? null,
        interview_region: profileRaw.interview_region ?? null,
        country: profileRaw.country ?? null,
        cv_summary: profileRaw.cv_summary ?? null,
        bio: profileRaw.bio ?? null,
        use_in_persona: profileRaw.use_in_persona ?? false,
      }
    : null;

  // 3. Fire all rephrase calls in parallel. Each is independent.
  const tasks = steps
    .filter((s) => !s.delivered_question && s.questions?.question)
    .map(async (st) => {
      try {
        const out = await chatJSON<RephraseAIResult>({
          messages: [
            { role: 'system', content: REPHRASE_SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildRephrasePrompt({
                level,
                category: st.questions!.category,
                subtopic: st.questions!.subtopic,
                question: st.questions!.question,
                profile,
              }),
            },
          ],
          schema: REPHRASE_SCHEMA,
          schemaName: 'RephraseQuestion',
          temperature: 0.6,
          maxTokens: 400,
        });
        const delivered = (out.data.delivered_question || '').trim();
        if (!delivered) return { id: st.id, ok: false, reason: 'empty' };
        const { error: updErr } = await supabase
          .from('interview_steps')
          .update({ delivered_question: delivered })
          .eq('id', st.id);
        if (updErr) return { id: st.id, ok: false, reason: updErr.message };
        return { id: st.id, ok: true };
      } catch (e: any) {
        return { id: st.id, ok: false, reason: e?.message || 'unknown' };
      }
    });
  const results = await Promise.allSettled(tasks);
  const failures = results
    .map((r) => (r.status === 'fulfilled' ? r.value : { id: 'n/a', ok: false, reason: r.reason?.message || String(r.reason) }))
    .filter((r) => !r.ok);
  if (failures.length > 0) {
    logger.warn('[rephrase] some steps failed (rendered as raw fallback)', { interviewId, failures });
  }
}
