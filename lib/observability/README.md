# Observability

Structured JSON logger that writes to `console.*`, which Cloudflare Workers
indexes automatically. No external service yet — Sentry is the planned next step
once we see real traffic (~50 paid users).

## Quick usage in API routes

```ts
import { withLogging, logger } from '@/lib/observability';

export const POST = withLogging('POST /api/grade', async (req, { requestId }) => {
  const body = await req.json();
  logger.info('grading started', { requestId, sessionId: body.sessionId });
  // ... your code; errors automatically caught
  return Response.json({ ok: true });
});
```

The wrapper:
- Adds an `x-request-id` header to every response
- Logs slow requests (>5s) as warnings
- Logs unhandled errors with full stack trace
- Returns `{ error, requestId }` JSON on 500 so users can quote the id

## Viewing logs

**Live tail (terminal not available here — skip):** `npx wrangler tail hardo-app`

**Dashboard:** [Cloudflare Workers Logs](https://dash.cloudflare.com/061b2bc44e6b28001b0cb1c287db9a7a/workers/services/view/hardo-app/production/observability/logs)
- Filter by `level = "error"` to see errors only
- Search for a specific `requestId` to trace one request end-to-end

## When a user reports a bug

1. Ask them for the `x-request-id` (visible in DevTools Network tab, or quoted on error UI)
2. Search that ID in Cloudflare Workers Logs
3. You get the full chain of `logger.info`/`error` calls for that request

## Migration path to Sentry (later)

Only one place needs change — `logger.error()` in `logger.ts`:

```ts
import * as Sentry from '@sentry/cloudflare';

error(msg, e, ctx) {
  emit({ ... });           // keep console output
  Sentry.captureException(e, { extra: { msg, ...ctx } });  // add this line
}
```

No call sites need editing.
