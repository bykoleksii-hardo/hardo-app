/**
 * Next.js instrumentation hook.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * register() runs once at server startup.
 * onRequestError() catches any unhandled error from React Server Components,
 * route handlers, and server actions — before Next returns a 500.
 *
 * Sentry is initialized here when SENTRY_DSN is set. If unset (e.g. in CI
 * or local dev), the SDK is skipped silently and only console logging runs.
 */
import * as Sentry from '@sentry/cloudflare';
import { logger } from '@/lib/observability/logger';

let sentryInitialized = false;

export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // No Sentry in this environment. Console logging still works.
    return;
  }
  try {
    Sentry.init({
      dsn,
      // Send structured logs (logger.info etc.) to Sentry's Logs product
      enableLogs: true,
      // Attach IP and user-agent automatically
      sendDefaultPii: true,
      // 0 = no transaction sampling; we did not enable Tracing in the Sentry project.
      tracesSampleRate: 0,
      environment: process.env.NEXT_PUBLIC_SITE_HOST === 'hardo-app.bykoleksii.workers.dev'
        ? 'production'
        : 'development',
    });
    sentryInitialized = true;
  } catch (e) {
    // Never let Sentry init crash the worker — just log and move on.
    console.error('sentry_init_failed', e instanceof Error ? e.message : e);
  }
}

export function isSentryReady(): boolean {
  return sentryInitialized;
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
