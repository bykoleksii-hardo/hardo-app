/**
 * Next.js instrumentation hook.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * register() runs once at server startup.
 * onRequestError() catches any unhandled error from React Server Components,
 * route handlers, and server actions — before Next returns a 500.
 *
 * When Sentry is added later, this is the file that wires it up.
 */
import { logger } from '@/lib/observability/logger';

export async function register(): Promise<void> {
  // No-op for now. Place future Sentry.init() / OpenTelemetry setup here.
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
