import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withLogging } from '@/lib/observability';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Body = { key_points?: unknown; model_answer?: unknown };

const MAX_POINTS = 12;
const MAX_POINT_LEN = 300;
const MAX_ANSWER_LEN = 6000;

export const PATCH = withLogging('PATCH /api/admin/questions/[id]/answer-key', async (request: Request, ctx: { params: Promise<{ id: string }> }, _ctx: { requestId: string }) => {
  const role = await getUserRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // key_points: array of non-empty strings (or null/empty to clear).
  let keyPoints: string[] | null = null;
  if (body.key_points != null) {
    if (!Array.isArray(body.key_points)) {
      return NextResponse.json({ error: 'invalid_key_points' }, { status: 400 });
    }
    const cleaned = body.key_points
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, MAX_POINT_LEN))
      .filter(Boolean);
    if (cleaned.length > MAX_POINTS) {
      return NextResponse.json({ error: 'too_many_key_points' }, { status: 400 });
    }
    keyPoints = cleaned.length ? cleaned : null;
  }

  // model_answer: string (or null/empty to clear).
  let modelAnswer: string | null = null;
  if (body.model_answer != null) {
    if (typeof body.model_answer !== 'string') {
      return NextResponse.json({ error: 'invalid_model_answer' }, { status: 400 });
    }
    const trimmed = body.model_answer.trim().slice(0, MAX_ANSWER_LEN);
    modelAnswer = trimmed.length ? trimmed : null;
  }

  // questions table has only a read-RLS policy; use service-role client (admin-gated above).
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .update({ key_points: keyPoints, model_answer: modelAnswer })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: data.id, key_points: keyPoints, model_answer: modelAnswer });
});
