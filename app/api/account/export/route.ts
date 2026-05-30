import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { withLogging, logger } from '@/lib/observability';

/**
 * GET /api/account/export
 * GDPR art. 20 (data portability): returns all personal data held for the
 * authenticated user as a single downloadable JSON document.
 */
export const GET = withLogging('account.export', async () => {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = user.id;

  // Pull interviews first so we can scope their children by interview id.
  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', uid);

  const interviewIds = (interviews ?? []).map((row) => row.id);

  const [
    profile,
    entitlements,
    skills,
    questionExposure,
    summaries,
    steps,
    stepFeedback,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('user_entitlements').select('*').eq('user_id', uid),
    supabase.from('user_skills').select('*').eq('user_id', uid),
    supabase.from('question_exposure').select('*').eq('user_id', uid),
    interviewIds.length
      ? supabase.from('interview_summaries').select('*').in('interview_id', interviewIds)
      : Promise.resolve({ data: [] }),
    interviewIds.length
      ? supabase.from('interview_steps').select('*').in('interview_id', interviewIds)
      : Promise.resolve({ data: [] }),
    supabase.from('interview_step_feedback').select('*').eq('user_id', uid),
  ]);

  const payload = {
    meta: {
      exported_at: new Date().toISOString(),
      schema_version: 1,
      account: {
        id: uid,
        email: user.email ?? null,
        created_at: user.created_at ?? null,
      },
    },
    data: {
      profile: profile.data ?? null,
      entitlements: entitlements.data ?? [],
      skills: skills.data ?? [],
      question_exposure: questionExposure.data ?? [],
      interviews: interviews ?? [],
      interview_summaries: summaries.data ?? [],
      interview_steps: steps.data ?? [],
      interview_step_feedback: stepFeedback.data ?? [],
    },
  };

  logger.info('account export generated', {
    userId: uid,
    interviews: interviewIds.length,
  });

  const filename = `hardo-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
});
