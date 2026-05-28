/**
 * Next.js instrumentation hook.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * register() runs once at server startup.
 * onRequestError() catches any unhandled error from React Server Components,
 * route handlers, and server actions — before Next returns a 500.
 */
import { logger } from '@/lib/observability/logger';

export async function register(): Promise<void> {
  // No-op. Observability runs via withLogging wrappers + logger calls.
  // Server-side Sentry on Next.js + @opennextjs/cloudflare is not yet
  // supported upstream (getsentry/sentry-javascript#14931 + follow-ups).
}

export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | undefined>;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource?: string;
    revalidateReason?: string;
  },
): Promise<void> {
  logger.error('unhandled request error', err, {
    route: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
  });
}
