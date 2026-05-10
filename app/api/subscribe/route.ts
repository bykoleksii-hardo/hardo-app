import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  // 1) Enqueue a pending row in Supabase via RPC.
  let token: string | null = null;
  let alreadyConfirmed = false;
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.rpc('enqueue_pending_subscription', { p_email: email });
    if (error) {
      console.log('[subscribe] rpc error', error.message);
      return NextResponse.json({ ok: false, error: 'storage' }, { status: 500 });
    }
    const row = Array.isArray(data) ? data[0] : data;
    token = row?.token ?? null;
    alreadyConfirmed = !!row?.already_confirmed;
  } catch (e: any) {
    console.log('[subscribe] rpc threw', e?.message);
    return NextResponse.json({ ok: false, error: 'storage' }, { status: 500 });
  }

  if (alreadyConfirmed) {
    // Pretend to send (do not reveal subscription state).
    return NextResponse.json({ ok: true, pending: true });
  }

  // 2) Send confirmation email via Resend (if configured).
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddr = process.env.EMAIL_FROM || 'HARDO <hello@hardo.app>';

  if (!apiKey) {
    console.log('[subscribe] no RESEND_API_KEY, token captured for email:', email);
    return NextResponse.json({ ok: true, pending: true, queued: true });
  }

  if (!token) {
    return NextResponse.json({ ok: true, pending: true });
  }

  try {
    const origin = new URL(req.url).origin;
    const confirmUrl = `${origin}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;

    const html = `<!doctype html><html><body style="font-family:Inter,system-ui,sans-serif;background:#FBF7EE;color:#11161E;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="font-size:22px;font-weight:600;letter-spacing:-0.01em;margin-bottom:24px;">HARDO</div>
    <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">Confirm your email to start receiving HARDO updates.</p>
    <p style="margin:24px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#11161E;color:#FBF7EE;padding:12px 20px;border-radius:9999px;text-decoration:none;font-size:13px;letter-spacing:0.02em;">Confirm subscription</a>
    </p>
    <p style="font-size:12px;color:#11161E80;line-height:1.55;margin:0 0 6px;">Or paste this link into your browser:</p>
    <p style="font-size:12px;color:#11161E80;word-break:break-all;margin:0 0 32px;">${confirmUrl}</p>
    <p style="font-size:12px;color:#11161E80;line-height:1.55;margin:0;">This link expires in 24 hours. If you didn't request it, ignore this email.</p>
  </div>
</body></html>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [email],
        subject: 'Confirm your HARDO subscription',
        html,
      }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.log('[subscribe] resend send err', r.status, txt);
    }
  } catch (e: any) {
    console.log('[subscribe] send threw', e?.message);
  }

  return NextResponse.json({ ok: true, pending: true });
}
