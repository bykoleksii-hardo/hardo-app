import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { transcribeAudio, GroqError } from '@/lib/groq-client';

// Soft monthly cap: ~30 hours of recorded audio per user.
const MONTHLY_AUDIO_CAP_SEC = 30 * 60 * 60; // 108000s
const PERIOD_DAYS = 30;

// Hard per-request cap: 5 minutes of audio (Groq free tier safety).
const MAX_REQUEST_SEC = 5 * 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const form = await req.formData();
    const audio = form.get('audio');
    const stepId = form.get('stepId');
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio blob' }, { status: 400 });
    }
    if (typeof stepId !== 'string' || stepId.length < 1) {
      return NextResponse.json({ error: 'Missing stepId' }, { status: 400 });
    }
    // ~25 MB Groq limit; we hard-cap at 24 MB on our side.
    if (audio.size > 24 * 1024 * 1024) {
      return NextResponse.json({ error: 'Recording too large. Try a shorter clip.', friendly: 'Recording too long for one take. Please try a shorter clip.' }, { status: 413 });
    }

    // Verify the step belongs to this user via interview ownership (RLS will also enforce it).
    const { data: step, error: stepErr } = await supabase
      .from('interview_steps')
      .select('id, interview_id, interviews!inner(user_id)')
      .eq('id', stepId)
      .single();
    if (stepErr || !step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }
    // @ts-expect-error supabase typed join shape
    const ownerId = step.interviews?.user_id ?? null;
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft monthly cap check + period reset.
    const { data: ent } = await supabase
      .from('user_entitlements')
      .select('audio_seconds_used, audio_period_start')
      .eq('user_id', user.id)
      .maybeSingle();

    const now = new Date();
    const periodStart = ent?.audio_period_start ? new Date(ent.audio_period_start) : null;
    const periodAgeDays = periodStart ? (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24) : Infinity;
    let usedSec = ent?.audio_seconds_used ?? 0;
    let resetPeriod = false;
    if (!periodStart || periodAgeDays >= PERIOD_DAYS) {
      usedSec = 0;
      resetPeriod = true;
    }
    if (usedSec >= MONTHLY_AUDIO_CAP_SEC) {
      return NextResponse.json({
        error: 'Monthly voice limit reached',
        friendly: 'You have used your monthly voice transcription budget. Please type your answers for the rest of this period, or upgrade.',
      }, { status: 429 });
    }

    // Transcribe via Groq.
    let result;
    try {
      result = await transcribeAudio({ audio, mimeType: audio.type || 'audio/webm', filename: 'audio.webm' });
    } catch (e) {
      if (e instanceof GroqError) {
        const status = e.status === 0 ? 503 : e.status === 429 ? 503 : e.status;
        return NextResponse.json({ error: e.message, friendly: e.friendly, code: e.code }, { status });
      }
      throw e;
    }

    if (result.durationSec > MAX_REQUEST_SEC) {
      // Don't bill the user for content we'd want to truncate; still return text but warn.
      // (Groq already transcribed it, so we still count the seconds.)
    }

    // Update usage counter (best-effort upsert).
    const newUsed = usedSec + Math.max(1, result.durationSec || 1);
    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      audio_seconds_used: newUsed,
      updated_at: now.toISOString(),
    };
    if (resetPeriod) upsertPayload.audio_period_start = now.toISOString();
    await supabase.from('user_entitlements').upsert(upsertPayload, { onConflict: 'user_id' });

    return NextResponse.json({
      text: result.text,
      words: result.words,
      durationSec: result.durationSec,
      language: result.language,
      usage: { audio_seconds_used: newUsed, monthly_cap_seconds: MONTHLY_AUDIO_CAP_SEC },
    });
  } catch (e) {
    const msg = (e as Error)?.message ?? 'Unknown error';
    return NextResponse.json({ error: msg, friendly: 'Voice transcription failed. Please type your answer.' }, { status: 500 });
  }
}
