import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { withLogging, logger } from '@/lib/observability';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withLogging('POST /api/interview/pause', async (req: Request, _ctx: { requestId: string }) => {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { interviewId?: string } | null;
  if (!body?.interviewId) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  // Defence-in-depth: only the owner may pause their interview.
  const { data: own } = await supabase
    .from('interviews')
    .select('id')
    .eq('id', body.interviewId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!own) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { error } = await supabase.rpc('pause_interview', { p_interview_id: body.interviewId });
  if (error) {
    logger.error('[pause] rpc error', error);
    return NextResponse.json({ error: 'Could not pause the interview.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
