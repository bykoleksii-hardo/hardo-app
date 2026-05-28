import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { withLogging, logger } from '@/lib/observability';
import * as Sentry from '@sentry/cloudflare';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Admin-only diagnostic endpoint for verifying Sentry integration.
// Hit GET /api/_debug/sentry-test?type=error  -> throws an error captured by withLogging
// Hit GET /api/_debug/sentry-test?type=message -> emits a Sentry.captureMessage at level 'info'
// Hit GET /api/_debug/sentry-test (no query)   -> reports SDK config snapshot only
//
// Safe to delete after Sentry has been confirmed receiving events.

export const GET = withLogging('GET /api/_debug/sentry-test', async (req: Request, { requestId }) => {
  const role = await getUserRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const type = new URL(req.url).searchParams.get('type');
  const dsnSet = !!process.env.SENTRY_DSN;

  if (type === 'error') {
    logger.info('sentry-test: about to throw', { requestId, type });
    throw new Error('sentry-test intentional error from /api/_debug/sentry-test');
  }

  if (type === 'message') {
    logger.info('sentry-test: capturing message', { requestId, type });
    Sentry.captureMessage('sentry-test manual message', { level: 'info', tags: { type: 'manual' } });
    return NextResponse.json({ ok: true, sent: 'message', dsnSet });
  }

  return NextResponse.json({
    ok: true,
    dsnSet,
    note: 'Append ?type=error or ?type=message to actually emit something to Sentry.',
  });
});
