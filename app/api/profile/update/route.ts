import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = [
  'first_name',
  'last_name',
  'preferred_name',
  'date_of_birth',
  'country',
  'city',
  'university',
  'major',
  'graduation_year',
  'current_position',
  'target_start_date',
  'cv_summary',
  'bio',
  'use_in_persona',
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) update[key] = body[key];
  }

  // sanitize types
  if ('graduation_year' in update) {
    const v = update.graduation_year;
    if (v === null || v === '') update.graduation_year = null;
    else {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 1900 || n > 2100) {
        return NextResponse.json({ error: 'invalid_graduation_year' }, { status: 400 });
      }
      update.graduation_year = Math.floor(n);
    }
  }

  if ('use_in_persona' in update) {
    update.use_in_persona = Boolean(update.use_in_persona);
  }

  for (const dateKey of ['date_of_birth', 'target_start_date'] as const) {
    if (dateKey in update) {
      const v = update[dateKey];
      if (v === null || v === '') update[dateKey] = null;
      else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) update[dateKey] = v;
      else return NextResponse.json({ error: `invalid_${dateKey}` }, { status: 400 });
    }
  }

  // upsert via RLS
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
