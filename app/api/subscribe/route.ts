import { NextResponse } from 'next/server';

export const runtime = 'edge';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = '';
  try {
    const body = await req.json().catch(() => ({}));
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  // Read Resend env from CF Workers runtime first, fallback to process.env (dev).
  // @ts-ignore
  const env = (globalThis as any).process?.env ?? {};
  const apiKey: string | undefined = env.RESEND_API_KEY;
  const audienceId: string | undefined = env.RESEND_AUDIENCE_ID;
  const notifyTo: string | undefined = env.SUBSCRIBE_NOTIFY_TO;
  const fromAddr: string = env.RESEND_FROM ?? 'HARDO <hello@hardo.app>';

  // No Resend configured — accept gracefully so the form still works
  // (will be wired live once user adds RESEND_API_KEY in Cloudflare).
  if (!apiKey) {
    console.log('[subscribe] no RESEND_API_KEY, captured email locally only:', email);
    return NextResponse.json({ ok: true, queued: true });
  }

  try {
    // 1) Add to Resend Audience (if audience id is configured)
    if (audienceId) {
      const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
      // 409 = already exists; we treat as success.
      if (!r.ok && r.status !== 409) {
        const txt = await r.text().catch(() => '');
        console.log('[subscribe] resend audience err', r.status, txt);
      }
    }

    // 2) Optional internal notification email
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
          subject: 'New HARDO subscriber',
          text: `New subscriber: ${email}`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log('[subscribe] error', e?.message);
    // Don't leak internals to user; accept the email anyway.
    return NextResponse.json({ ok: true, queued: true });
  }
}
