import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyWebhookSignature, normalizeSubscriptionStatus } from '@/lib/lemonsqueezy';
import { withLogging, logger } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lemon Squeezy webhook handler. Verifies HMAC-SHA256 signature against
// LEMONSQUEEZY_WEBHOOK_SECRET, then calls the SECURITY DEFINER RPC
// 'apply_lemonsqueezy_event' to update the users row. No service-role key
// is used in this code; the RPC enforces auth via the shared secret already
// verified above.

interface LsWebhookEnvelope {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string };
  };
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

export const POST = withLogging('POST /api/billing/webhook', async (req: Request, ctx: { requestId: string }) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');
  const valid = await verifyWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    logger.warn('lemonsqueezy webhook rejected: invalid signature', { requestId: ctx.requestId });
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payload: LsWebhookEnvelope;
  try {
    payload = JSON.parse(rawBody) as LsWebhookEnvelope;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const attrs = (payload.data?.attributes ?? {}) as Record<string, unknown>;

  if (!userId || !eventName?.startsWith('subscription_')) {
    return NextResponse.json({ ok: true, ignored: true, event: eventName });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });
  }

  // Anonymous client (no cookies). The RPC is SECURITY DEFINER and
  // gates writes via a shared secret stored in pg_settings.
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const lsStatus = (attrs['status'] as string | undefined) ?? null;
  const status = normalizeSubscriptionStatus(lsStatus);
  const lsCustomerId = attrs['customer_id'];
  const lsSubscriptionId = payload.data?.id ?? null;
  const renewsAt = (attrs['renews_at'] as string | undefined) ?? null;
  const endsAt = (attrs['ends_at'] as string | undefined) ?? null;
  const variantId = attrs['variant_id'];

  const rpcSecret = process.env.LEMONSQUEEZY_RPC_SECRET;
  if (!rpcSecret) {
    return NextResponse.json({ error: 'rpc_secret_not_configured' }, { status: 503 });
  }

  // Idempotency: dedup duplicate webhook deliveries (LemonSqueezy retries).
  // Keyed by the HMAC signature hex, unique per exact payload. Gated by the
  // same shared secret as apply_lemonsqueezy_event.
  const { data: firstTime, error: dedupError } = await supabase.rpc('claim_webhook_event', {
    p_secret: rpcSecret,
    p_event_key: signature,
    p_event_name: eventName,
  });
  if (dedupError) {
    return NextResponse.json({ error: 'dedup_failed', message: dedupError.message }, { status: 500 });
  }
  if (firstTime === false) {
    logger.info('lemonsqueezy webhook duplicate ignored', { requestId: ctx.requestId, event: eventName });
    return NextResponse.json({ ok: true, duplicate: true, event: eventName });
  }

  const { error } = await supabase.rpc('apply_lemonsqueezy_event', {
    p_secret: rpcSecret,
    p_user_id: userId,
    p_status: status,
    p_subscription_id: lsSubscriptionId,
    p_customer_id: lsCustomerId != null ? String(lsCustomerId) : null,
    p_variant_id: variantId != null ? String(variantId) : null,
    p_current_period_end: renewsAt ?? endsAt ?? null,
  });

  if (error) {
    return NextResponse.json({ error: 'rpc_failed', message: error.message }, { status: 500 });
  }

  logger.info('lemonsqueezy webhook applied', { requestId: ctx.requestId, userId, event: eventName, status: status ?? null });
  return NextResponse.json({ ok: true, event: eventName, status });
});

export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
