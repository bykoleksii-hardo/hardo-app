import { NextResponse } from 'next/server';
import { logger, newRequestId } from './logger';

type AnyRequest = Request;
type RouteHandler<TReq extends AnyRequest = Request> = (
  req: TReq,
  ctx: { requestId: string },
) => Promise<Response>;

/**
 * Add an x-request-id header by cloning the response.
 * Avoids the "headers immutable" issue some runtimes have with mutating
 * a NextResponse/Response after it has been returned from a handler.
 */
function withRequestId(res: Response, requestId: string): Response {
  try {
    // Fast path: try mutating first
    res.headers.set('x-request-id', requestId);
    return res;
  } catch {
    // Headers immutable — clone with new headers
    const headers = new Headers(res.headers);
    headers.set('x-request-id', requestId);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }
}

/**
 * Wrap a Next.js Route Handler with structured error logging
 * and an x-request-id header on every response.
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
      const dur = Date.now() - start;
      if (dur > 5000) {
        logger.warn('slow request', {
          requestId,
          route: routeLabel,
          durationMs: dur,
          status: res.status,
        });
      }
      return withRequestId(res, requestId);
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
