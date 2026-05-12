import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getCustomerPortalUrl } from '@/lib/lemonsqueezy';
import { withLogging } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withLogging('POST /api/billing/portal', async (_req: Request, _ctx: { requestId: string }) => {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  if (!process.env.LEMONSQUEEZY_API_KEY) {
    return NextResponse.json(
      { error: 'billing_not_configured', message: 'LEMONSQUEEZY_API_KEY not set' },
      { status: 503 }
    );
  }

  const { data: row, error } = await supabase
    .from('users')
    .select('lemonsqueezy_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'lookup_failed', message: error.message }, { status: 500 });
  }
  const customerId = row?.lemonsqueezy_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: 'no_subscription', message: 'No active subscription found' },
      { status: 404 }
    );
  }

  try {
    const { url } = await getCustomerPortalUrl(String(customerId));
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: 'portal_failed', message: msg }, { status: 500 });
  }
});
