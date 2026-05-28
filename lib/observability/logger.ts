/**
 * Structured logger for HARDO.
 *
 * Outputs JSON lines so Cloudflare Workers Logs (`wrangler tail` and dashboard)
 * can index fields like requestId, userId, route, level.
 *
 * When SENTRY_DSN is configured (see instrumentation.ts), `logger.error()`
 * also forwards exceptions to Sentry. All other call sites are unchanged.
 */
import * as Sentry from '@sentry/cloudflare';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  requestId?: string;
  userId?: string;
  route?: string;
  sessionId?: string;
  questionId?: string;
  [key: string]: unknown;
};

type LogPayload = {
  ts: string;
  level: LogLevel;
  msg: string;
  ctx?: LogContext;
  err?: {
    name: string;
    message: string;
    stack?: string;
  };
};

function emit(payload: LogPayload): void {
  const line = JSON.stringify(payload);
  // CF Workers respect console.* levels in dashboard Logs view.
  switch (payload.level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}

function normalizeError(e: unknown): LogPayload['err'] {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  return { name: 'NonError', message: typeof e === 'string' ? e : JSON.stringify(e) };
}

/**
 * Safe wrapper for Sentry calls. Sentry SDK is a no-op until init runs;
 * calls before init() are silently dropped and never throw.
 */
function captureToSentry(msg: string, e: unknown, ctx?: LogContext): void {
  try {
    if (e instanceof Error) {
      Sentry.captureException(e, {
        tags: ctx?.route ? { route: String(ctx.route) } : undefined,
        extra: { msg, ...(ctx ?? {}) },
      });
    } else if (e !== undefined) {
      Sentry.captureMessage(msg, {
        level: 'error',
        extra: { error: e, ...(ctx ?? {}) },
      });
    } else {
      Sentry.captureMessage(msg, { level: 'error', extra: ctx });
    }
  } catch {
    // Never let Sentry break the request path.
  }
}

export const logger = {
  debug(msg: string, ctx?: LogContext) {
    emit({ ts: new Date().toISOString(), level: 'debug', msg, ctx });
  },
  info(msg: string, ctx?: LogContext) {
    emit({ ts: new Date().toISOString(), level: 'info', msg, ctx });
  },
  warn(msg: string, ctx?: LogContext) {
    emit({ ts: new Date().toISOString(), level: 'warn', msg, ctx });
  },
  /**
   * Single point of error capture. Writes structured JSON to console
   * AND forwards to Sentry (when SENTRY_DSN is set).
   */
  error(msg: string, e?: unknown, ctx?: LogContext) {
    emit({
      ts: new Date().toISOString(),
      level: 'error',
      msg,
      ctx,
      err: e !== undefined ? normalizeError(e) : undefined,
    });
    captureToSentry(msg, e, ctx);
  },
};

/**
 * Generate a short request ID (8 hex chars, ~32 bits of entropy).
 * Use this in API routes to correlate logs for one request:
 *
 *   const reqId = newRequestId();
 *   try { ... } catch (e) { logger.error('handler failed', e, { requestId: reqId, route: '/api/foo' }); }
 *
 * Return `x-request-id` header so users can quote it in support tickets.
 */
export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(16).slice(2, 10);
}
