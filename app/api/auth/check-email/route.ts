import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitTake, rateLimitSubject, rateLimitedResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-only route that checks whether an email is already registered.
// Uses service_role to query public.users (mirrored from auth.users). Returns
// { exists: boolean }. Used by the signup form to surface a friendly
// "already registered" message instead of silently no-op'ing.
export async function POST(req: Request) {
  const rl = await rateLimitTake(rateLimitSubject({ req }), { bucket: 'auth.check-email', capacity: 20, windowSeconds: 600 });
  if (!rl.allowed) return rateLimitedResponse(rl);

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Authoritative lookup via auth schema mirror in public.users.
  const { data: row, error } = await admin
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
  }

  return NextResponse.json({ exists: !!row });
}

export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
