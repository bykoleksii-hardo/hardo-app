// Minimal Groq Whisper STT wrapper for Hardo.
// Uses whisper-large-v3-turbo (fast + cheap) with verbose_json + word timestamps.

export type WhisperWord = { word: string; start: number; end: number };

export type WhisperResult = {
  text: string;
  words: WhisperWord[];
  durationSec: number;
  language: string | null;
};

export class GroqError extends Error {
  status: number;
  code: string | null;
  rawBody: string;
  friendly: string;
  constructor(opts: { status: number; code: string | null; rawBody: string; message: string; friendly: string }) {
    super(opts.message);
    this.name = 'GroqError';
    this.status = opts.status;
    this.code = opts.code;
    this.rawBody = opts.rawBody;
    this.friendly = opts.friendly;
  }
}

function friendlyFromGroq(status: number): string {
  if (status === 401) return 'Voice transcription is misconfigured. Please contact the administrator.';
  if (status === 413) return 'Recording too long for one chunk. Try a shorter take.';
  if (status === 429) return 'Voice service is busy right now. Please try again in a few seconds, or type your answer.';
  if (status >= 500) return 'Voice service is having a hiccup. Please try again in a moment.';
  if (status === 400) return 'We could not understand that recording. Please try again.';
  return 'Voice transcription is unavailable right now. Please type your answer.';
}

function parseGroqError(body: string): { code: string | null; message: string } {
  try {
    const j = JSON.parse(body) as { error?: { code?: string; message?: string } };
    return { code: j.error?.code ?? null, message: j.error?.message ?? body.slice(0, 300) };
  } catch {
    return { code: null, message: body.slice(0, 300) };
  }
}

const DEFAULT_MODEL = 'whisper-large-v3-turbo';
// IB-domain prompt to bias decoding toward common interview vocabulary.
const DEFAULT_PROMPT = 'Investment banking interview answer. Common terms: EBITDA, DCF, WACC, LBO, M&A, accretion/dilution, multiples, comps, EV/EBITDA, P/E, leveraged buyout, due diligence, syndicate, IPO, equity, debt, enterprise value.';

export async function transcribeAudio(opts: {
  audio: ArrayBuffer | Blob;
  filename?: string;
  mimeType?: string;
  prompt?: string;
  model?: string;
  language?: string;
}): Promise<WhisperResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError({
      status: 0, code: 'no_api_key', rawBody: '',
      message: 'GROQ_API_KEY is not configured',
      friendly: 'Voice transcription is misconfigured. Please contact the administrator.',
    });
  }

  const blob: Blob = opts.audio instanceof Blob
    ? opts.audio
    : new Blob([opts.audio], { type: opts.mimeType ?? 'audio/webm' });

  const fd = new FormData();
  fd.append('file', blob, opts.filename ?? 'audio.webm');
  fd.append('model', opts.model ?? DEFAULT_MODEL);
  fd.append('response_format', 'verbose_json');
  fd.append('timestamp_granularities[]', 'word');
  if (opts.prompt !== '') fd.append('prompt', opts.prompt ?? DEFAULT_PROMPT);
  if (opts.language) fd.append('language', opts.language);
  // Slight bias toward deterministic output.
  fd.append('temperature', '0');

  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });
  const text = await r.text();
  if (!r.ok) {
    const parsed = parseGroqError(text);
    throw new GroqError({
      status: r.status,
      code: parsed.code,
      rawBody: text.slice(0, 800),
      message: `groq ${r.status} ${parsed.code ?? ''}: ${parsed.message}`,
      friendly: friendlyFromGroq(r.status),
    });
  }

  let j: { text?: string; words?: WhisperWord[]; duration?: number; language?: string };
  try {
    j = JSON.parse(text);
  } catch {
    throw new GroqError({
      status: 200, code: 'non_json_response', rawBody: text.slice(0, 300),
      message: 'groq returned non-JSON',
      friendly: 'Voice transcription returned an unreadable response. Please try again.',
    });
  }

  const words: WhisperWord[] = Array.isArray(j.words)
    ? j.words.map(w => ({ word: String(w.word ?? ''), start: Number(w.start ?? 0), end: Number(w.end ?? 0) }))
    : [];

  return {
    text: (j.text ?? '').trim(),
    words,
    durationSec: Math.max(0, Math.round(Number(j.duration ?? 0))),
    language: j.language ?? null,
  };
}
