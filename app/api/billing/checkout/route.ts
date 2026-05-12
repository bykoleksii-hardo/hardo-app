import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/lemonsqueezy';
import { withLogging } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withLogging('POST /api/billing/checkout', async (_req: Request, _ctx: { requestId: string }) => {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!variantId) {
    return NextResponse.json(
      { error: 'billing_not_configured', message: 'LEMONSQUEEZY_VARIANT_ID not set' },
      { status: 503 }
    );
  }

  // Fetch optional name from users row to prefill checkout.
  const { data: row } = await supabase
    .from('users')
    .select('email, nickname')
    .eq('id', user.id)
    .maybeSingle();

  // Build redirect URL back to /profile/account after successful purchase.
  const proto = process.env.NEXT_PUBLIC_SITE_PROTO ?? 'https';
  const host = process.env.NEXT_PUBLIC_SITE_HOST ?? 'hardo-app.bykoleksii.workers.dev';
  const redirectUrl = `${proto}://${host}/profile/account?upgraded=1`;

  try {
    const { url } = await createCheckoutSession({
      variantId,
      userId: user.id,
      email: row?.email ?? user.email ?? null,
      name: row?.nickname ?? null,
      redirectUrl,
    });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: 'checkout_failed', message: msg }, { status: 500 });
  }
});
