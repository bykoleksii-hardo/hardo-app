import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// Diagnostic-only: verify STT provider configuration.
// Returns presence of keys + pings Deepgram with an obviously bad request to confirm auth header is accepted.
// DELETE THIS FILE AFTER FALLBACK IS VERIFIED.

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'auth required' }, { status: 401 });

    const groqKey = process.env.GROQ_API_KEY;
    const dgKey = process.env.DEEPGRAM_API_KEY;
    const primary = process.env.STT_PRIMARY || '(unset, defaults to groq)';
    const fallback = process.env.STT_FALLBACK || '(unset, defaults to deepgram)';

    const out: Record<string, unknown> = {
      env: {
        GROQ_API_KEY_present: !!groqKey,
        GROQ_API_KEY_len: groqKey ? groqKey.length : 0,
        DEEPGRAM_API_KEY_present: !!dgKey,
        DEEPGRAM_API_KEY_len: dgKey ? dgKey.length : 0,
        STT_PRIMARY: primary,
        STT_FALLBACK: fallback,
      },
    };

    // Ping Deepgram with an empty body — should respond 400 with a clear message if auth works,
    // 401 if the key is wrong, network-error if unreachable.
    if (dgKey) {
      try {
        const r = await fetch('https://api.deepgram.com/v1/listen?model=nova-2-general', {
          method: 'POST',
          headers: { Authorization: `Token ${dgKey}`, 'Content-Type': 'audio/wav' },
          body: new Uint8Array(0),
        });
        const body = (await r.text()).slice(0, 300);
        out.deepgram_probe = { status: r.status, body };
      } catch (e) {
        out.deepgram_probe = { status: 0, error: (e as Error).message };
      }
    }

    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
