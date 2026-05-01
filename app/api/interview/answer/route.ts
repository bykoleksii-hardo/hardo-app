// DEPRECATED shim. The interview now uses /api/interview/turn for every message.
// We keep this route so any in-flight client code that still calls /answer keeps working
// until the new client is fully deployed.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { stepId?: string; answer?: string } | null;
  if (!body?.stepId || typeof body.answer !== 'string') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const url = new URL('/api/interview/turn', req.url);
  const r = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
    body: JSON.stringify({ stepId: body.stepId, message: body.answer }),
  });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json(j, { status: r.status });
}
