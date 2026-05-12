import { NextResponse } from 'next/server';
import { logger, newRequestId } from './logger';

type AnyRequest = Request;
type RouteHandler<TReq extends AnyRequest = Request> = (
  req: TReq,
  ctx: { requestId: string },
) => Promise<Response>;

/**
 * Wrap a Next.js Route Handler with structured error logging
 * and an x-request-id header.
 *
 * - Generates a short requestId per call
 * - Catches unhandled exceptions, logs via logger.error
 * - Returns { error, requestId } 500 JSON for unhandled cases
 * - Logs slow requests (>5s) as warnings
 * - Always sets x-request-id on the response
 *
 * Existing routes that manage their own try/catch can also adopt this:
 * the inner try/catch still runs; withLogging only catches what bubbles past it.
 *
 * Usage:
 *   export const POST = withLogging('POST /api/foo', async (req, { requestId }) => {
 *     logger.info('start', { requestId });
 *     return Response.json({ ok: true });
 *   });
 */
export function withLogging<TReq extends AnyRequest = Request>(
  routeLabel: string,
  handler: RouteHandler<TReq>,
) {
  return async (req: TReq): Promise<Response> => {
    const requestId = newRequestId();
    const start = Date.now();
    try {
      const res = await handler(req, { requestId });
      try {
        res.headers.set('x-request-id', requestId);
      } catch {
        // Response headers may be immutable in some runtimes — ignore.
      }
      const dur = Date.now() - start;
      if (dur > 5000) {
        logger.warn('slow request', {
          requestId,
          route: routeLabel,
          durationMs: dur,
          status: res.status,
        });
      }
      return res;
    } catch (e) {
      const dur = Date.now() - start;
      logger.error('unhandled exception in route', e, {
        requestId,
        route: routeLabel,
        durationMs: dur,
      });
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500, headers: { 'x-request-id': requestId } },
      );
    }
  };
}
