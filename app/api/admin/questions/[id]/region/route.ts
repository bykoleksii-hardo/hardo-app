import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REGIONS = ['US', 'EMEA', 'Global'] as const;
type Region = (typeof REGIONS)[number];

type Body = { region?: string };

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const region = body.region;
  if (typeof region !== 'string' || !(REGIONS as readonly string[]).includes(region)) {
    return NextResponse.json({ error: 'invalid_region' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('questions')
    .update({ region: region as Region })
    .eq('id', id)
    .select('id, region')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: data.id, region: data.region });
}
