// Minimal Deepgram STT wrapper for Hardo.
// Uses Nova-2 (good quality, lower cost than Nova-3, sufficient for IB interview prep).

import type { WhisperResult, WhisperWord } from './groq-client';

export class DeepgramError extends Error {
  status: number;
  code: string | null;
  rawBody: string;
  friendly: string;
  constructor(opts: { status: number; code: string | null; rawBody: string; message: string; friendly: string }) {
    super(opts.message);
    this.name = 'DeepgramError';
    this.status = opts.status;
    this.code = opts.code;
    this.rawBody = opts.rawBody;
    this.friendly = opts.friendly;
  }
}

const DEFAULT_MODEL = 'nova-2-general';

function friendlyFromDeepgram(status: number): string {
  if (status === 401) return 'Voice transcription is misconfigured. Please contact the administrator.';
  if (status === 402) return 'Voice transcription is temporarily unavailable. Please type your answer.';
  if (status === 413) return 'Recording too long for one chunk. Try a shorter take.';
  if (status === 429) return 'Voice transcription is rate-limited. Please try again in a moment.';
  if (status >= 500) return 'Voice transcription is temporarily unavailable. Please type your answer.';
  return 'Voice transcription failed. Please type your answer.';
}

function parseDeepgramError(body: string): { code: string | null; message: string } {
  try {
    const j = JSON.parse(body);
    const code = (j.err_code || j.errCode || j.code || null) as string | null;
    const message = (j.err_msg || j.errMsg || j.message || j.reason || body.slice(0, 200)) as string;
    return { code, message };
  } catch {
    return { code: null, message: body.slice(0, 200) };
  }
}

export type DeepgramOpts = {
  audio: Blob | ArrayBuffer | Uint8Array;
  mimeType?: string;
  filename?: string;
  model?: string;
  language?: string;
};

export async function transcribeAudioDeepgram(opts: DeepgramOpts): Promise<WhisperResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new DeepgramError({
      status: 0, code: 'no_api_key', rawBody: '',
      message: 'DEEPGRAM_API_KEY is not configured',
      friendly: 'Voice transcription is misconfigured. Please contact the administrator.',
    });
  }

  // Deepgram accepts raw audio bytes (not multipart). Send the body as-is with the right Content-Type.
  const blob: Blob = opts.audio instanceof Blob
    ? opts.audio
    : new Blob([opts.audio as ArrayBuffer], { type: opts.mimeType || 'audio/webm' });
  const contentType = blob.type || opts.mimeType || 'audio/webm';

  const params = new URLSearchParams({
    model: opts.model || DEFAULT_MODEL,
    smart_format: 'true',
    punctuate: 'true',
    utterances: 'false',
    diarize: 'false',
  });
  if (opts.language) {
    params.set('language', opts.language);
  } else {
    params.set('detect_language', 'true');
  }

  const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': contentType,
    },
    body: blob,
  });
  const text = await r.text();
  if (!r.ok) {
    const parsed = parseDeepgramError(text);
    throw new DeepgramError({
      status: r.status,
      code: parsed.code,
      rawBody: text.slice(0, 800),
      message: `deepgram ${r.status} ${parsed.code || ''}: ${parsed.message}`,
      friendly: friendlyFromDeepgram(r.status),
    });
  }

  let j: {
    metadata?: { duration?: number };
    results?: {
      channels?: Array<{
        detected_language?: string;
        alternatives?: Array<{
          transcript?: string;
          words?: Array<{ word?: string; punctuated_word?: string; start?: number; end?: number }>;
        }>;
      }>;
    };
  };
  try {
    j = JSON.parse(text);
  } catch {
    throw new DeepgramError({
      status: 200, code: 'non_json_response', rawBody: text.slice(0, 300),
      message: 'deepgram returned non-JSON',
      friendly: 'Voice transcription returned an unreadable response. Please try again.',
    });
  }

  const channel = j.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  const transcript = (alt?.transcript || '').trim();
  const words: WhisperWord[] = Array.isArray(alt?.words)
    ? alt!.words!.map((w) => ({
        word: String(w.punctuated_word || w.word || ''),
        start: Number(w.start || 0),
        end: Number(w.end || 0),
      }))
    : [];
  const durationSec = Math.max(0, Math.round(Number(j.metadata?.duration || 0)));
  const language = channel?.detected_language || null;

  return { text: transcript, words, durationSec, language };
}
