// STT orchestrator: routes between Groq (primary) and Deepgram (fallback).
// Env:
//   STT_PRIMARY   = 'groq' | 'deepgram'    (default: 'groq')
//   STT_FALLBACK  = 'deepgram' | 'groq' | 'none'  (default: 'deepgram')

import { transcribeAudio as transcribeGroq, GroqError, type WhisperResult } from './groq-client';
import { transcribeAudioDeepgram, DeepgramError } from './deepgram-client';

export type STTProvider = 'groq' | 'deepgram';

export class STTError extends Error {
  status: number;
  code: string | null;
  friendly: string;
  provider: STTProvider | 'both';
  rawBody: string;
  constructor(opts: { status: number; code: string | null; friendly: string; provider: STTProvider | 'both'; message: string; rawBody?: string }) {
    super(opts.message);
    this.name = 'STTError';
    this.status = opts.status;
    this.code = opts.code;
    this.friendly = opts.friendly;
    this.provider = opts.provider;
    this.rawBody = opts.rawBody || '';
  }
}

export type TranscribeOpts = {
  audio: Blob;
  mimeType?: string;
  filename?: string;
  language?: string;
};

export type TranscribeOutcome = WhisperResult & {
  provider: STTProvider;
  fellBack: boolean;
};

function pickProvider(name: string | undefined, fallback: STTProvider): STTProvider {
  if (name === 'deepgram') return 'deepgram';
  if (name === 'groq') return 'groq';
  return fallback;
}

// Status codes that mean "this provider is unavailable / out of credit / overloaded".
// 400-class client errors (bad audio etc) do NOT trigger fallback.
function shouldFallback(status: number): boolean {
  if (status === 0) return true;        // network error
  if (status === 401) return true;      // auth misconfig — try the other provider
  if (status === 402) return true;      // payment required / out of credit
  if (status === 408) return true;      // request timeout
  if (status === 429) return true;      // rate limit
  if (status >= 500) return true;       // upstream 5xx
  return false;
}

async function callOne(provider: STTProvider, opts: TranscribeOpts): Promise<WhisperResult> {
  if (provider === 'deepgram') {
    return transcribeAudioDeepgram({
      audio: opts.audio,
      mimeType: opts.mimeType,
      filename: opts.filename,
      language: opts.language,
    });
  }
  return transcribeGroq({
    audio: opts.audio,
    mimeType: opts.mimeType,
    filename: opts.filename,
    language: opts.language,
  });
}

function toSTTError(e: unknown, provider: STTProvider): STTError {
  if (e instanceof GroqError || e instanceof DeepgramError) {
    return new STTError({
      status: e.status,
      code: e.code,
      friendly: e.friendly,
      provider,
      message: e.message,
      rawBody: e.rawBody,
    });
  }
  const msg = (e as Error)?.message || 'unknown STT error';
  return new STTError({
    status: 500, code: 'unknown', friendly: 'Voice transcription failed. Please type your answer.',
    provider, message: msg,
  });
}

export async function transcribeAudioWithFallback(opts: TranscribeOpts): Promise<TranscribeOutcome> {
  const primary = pickProvider(process.env.STT_PRIMARY, 'groq');
  const fallbackRaw = process.env.STT_FALLBACK;
  const fallback: STTProvider | 'none' =
    fallbackRaw === 'none' ? 'none' :
    fallbackRaw === 'groq' ? 'groq' :
    fallbackRaw === 'deepgram' ? 'deepgram' :
    (primary === 'groq' ? 'deepgram' : 'groq');

  try {
    const r = await callOne(primary, opts);
    return { ...r, provider: primary, fellBack: false };
  } catch (e) {
    const primaryErr = toSTTError(e, primary);
    // Decide whether to attempt fallback
    if (fallback === 'none' || fallback === primary || !shouldFallback(primaryErr.status)) {
      throw primaryErr;
    }
    // Log to console so it shows up in CF observability
    try {
      console.warn('[stt] primary failed, falling back', {
        primary,
        fallback,
        status: primaryErr.status,
        code: primaryErr.code,
      });
    } catch { /* noop */ }

    try {
      const r2 = await callOne(fallback as STTProvider, opts);
      return { ...r2, provider: fallback as STTProvider, fellBack: true };
    } catch (e2) {
      const fbErr = toSTTError(e2, fallback as STTProvider);
      // Both providers failed — surface the fallback error but include primary status.
      throw new STTError({
        status: fbErr.status,
        code: fbErr.code,
        friendly: fbErr.friendly,
        provider: 'both',
        message: `primary(${primary}) ${primaryErr.status}: ${primaryErr.message} | fallback(${fallback}) ${fbErr.status}: ${fbErr.message}`,
        rawBody: fbErr.rawBody,
      });
    }
  }
}
