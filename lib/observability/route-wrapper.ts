import { NextResponse, type NextRequest } from 'next/server';
import { logger, newRequestId } from './logger';

type RouteHandler = (req: NextRequest, ctx: { requestId: string }) => Promise<Response>;

/**
 * Wrap a Next.js API route handler with structured error logging
 * and a request-id header. Catches unhandled errors, logs them,
 * and returns a 500 JSON response with the request id so the user
 * can quote it in support.
 *
 * Usage:
 *   export const POST = withLogging('POST /api/foo', async (req, { requestId }) => {
 *     // ... your handler
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function withLogging(routeLabel: string, handler: RouteHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const requestId = newRequestId();
    const start = Date.now();
    try {
      const res = await handler(req, { requestId });
      // Attach request id so client can show it on error UI
      res.headers.set('x-request-id', requestId);
      const dur = Date.now() - start;
      if (dur > 5000) {
        logger.warn('slow request', { requestId, route: routeLabel, durationMs: dur, status: res.status });
      }
      return res;
    } catch (e) {
      const dur = Date.now() - start;
      logger.error('unhandled exception in route', e, { requestId, route: routeLabel, durationMs: dur });
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500, headers: { 'x-request-id': requestId } },
      );
    }
  };
}
