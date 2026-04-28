import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { stepId?: string; answer?: string } | null;
  if (!body?.stepId || typeof body.answer !== 'string') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  if (body.answer.trim().length < 2) {
    return NextResponse.json({ error: 'answer too short' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('submit_answer', {
    p_step_id: body.stepId,
    p_answer: body.answer.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
