import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { withLogging } from '@/lib/observability';

export const dynamic = 'force-dynamic';

type Body = {
  step_id?: unknown;
  rating?: unknown;
};

function isUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export const POST = withLogging('interview.feedback', async (request: Request, _ctx) => {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const stepId = body.step_id;
  const ratingRaw = body.rating;

  if (!isUuid(stepId)) {
    return NextResponse.json({ error: 'invalid_step_id' }, { status: 400 });
  }
  if (ratingRaw !== 1 && ratingRaw !== -1 && ratingRaw !== 0) {
    return NextResponse.json({ error: 'invalid_rating' }, { status: 400 });
  }

  // rating === 0 means "remove my feedback for this step"
  if (ratingRaw === 0) {
    const { error } = await supabase
      .from('interview_step_feedback')
      .delete()
      .eq('user_id', user.id)
      .eq('step_id', stepId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, rating: 0 });
  }

  // Upsert with the new rating (-1 or 1). RLS enforces ownership of the step.
  const { error } = await supabase
    .from('interview_step_feedback')
    .upsert(
      { user_id: user.id, step_id: stepId, rating: ratingRaw },
      { onConflict: 'user_id,step_id' }
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, rating: ratingRaw });
});
