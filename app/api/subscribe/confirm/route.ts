import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { withLogging, logger } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withLogging('subscribe.confirm', async (req: Request, _ctx) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  const origin = url.origin;

  const redirectWith = (status: string) =>
    NextResponse.redirect(`${origin}/subscribe/confirm?status=${status}`, { status: 303 });

  if (!token || token.length < 16) {
    return redirectWith('invalid');
  }

  let email: string | null = null;
  let rpcStatus = 'invalid';
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.rpc('confirm_pending_subscription', { p_token: token });
    if (error) {
      logger.info('[subscribe-confirm] rpc error', { error: error.message });
      return redirectWith('error');
    }
    const row = Array.isArray(data) ? data[0] : data;
    email = row?.email ?? null;
    rpcStatus = row?.status ?? 'invalid';
  } catch (e: any) {
    logger.info('[subscribe-confirm] rpc threw', { error: e?.message });
    return redirectWith('error');
  }

  if (rpcStatus === 'expired') return redirectWith('expired');
  if (rpcStatus === 'invalid') return redirectWith('invalid');
  if (rpcStatus === 'already_confirmed') return redirectWith('already');

  // rpcStatus === 'confirmed' — wire to Resend audience + notify
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const notifyTo = process.env.SUBSCRIBE_NOTIFY_TO;
  const fromAddr = process.env.EMAIL_FROM || 'HARDO <hello@hardo.app>';

  if (apiKey && email) {
    try {
      if (audienceId) {
        const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ email, unsubscribed: false }),
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => '');
          logger.info('[subscribe-confirm] audience err', { status: r.status, body: txt });
        }
      }
      if (notifyTo) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromAddr,
            to: [notifyTo],
            subject: 'New HARDO subscriber (confirmed)',
            text: `New confirmed subscriber: ${email}`,
          }),
        });
      }
    } catch (e: any) {
      logger.info('[subscribe-confirm] post-confirm err', { error: e?.message });
    }
  }

  return redirectWith('success');
});
