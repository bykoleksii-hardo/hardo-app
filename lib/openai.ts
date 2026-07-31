// Minimal OpenAI Chat Completions wrapper used by interview turn / finalize.
// We talk to the public API directly so we keep the bundle tiny on Workers.

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Model tier for the grading-critical calls (block grading + finalize). These
// are low-frequency (once per block / once per interview), latency-tolerant,
// and carry the product's core promise - so they can afford a stronger model
// than the hot conversational turn path. Defaults to the base model, so
// behavior is unchanged until OPENAI_MODEL_GRADING is set in the environment.
export const GRADING_MODEL = process.env.OPENAI_MODEL_GRADING || DEFAULT_MODEL;

// Base URL for the Chat Completions API. Defaults to OpenAI; can be pointed at
// any OpenAI-compatible endpoint (e.g. an Azure/OpenRouter/Gemini-compat gateway)
// via OPENAI_BASE_URL — used by the eval harness to grade against alternate
// models without touching production. Trailing slashes are trimmed.
const API_BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const CHAT_COMPLETIONS_URL = `${API_BASE}/chat/completions`;

// Structured error so callers can show a friendly UI message instead of leaking raw API output.
export class OpenAIError extends Error {
  status: number;
  code: string | null;
  type: string | null;
  rawBody: string;
  friendly: string;
  constructor(opts: { status: number; code: string | null; type: string | null; rawBody: string; message: string; friendly: string }) {
    super(opts.message);
    this.name = 'OpenAIError';
    this.status = opts.status;
    this.code = opts.code;
    this.type = opts.type;
    this.rawBody = opts.rawBody;
    this.friendly = opts.friendly;
  }
}

function friendlyFromOpenAI(status: number, code: string | null, type: string | null): string {
  if (code === 'insufficient_quota' || type === 'insufficient_quota') {
    return 'The interviewer is offline right now (billing limit reached). Please try again later.';
  }
  if (code === 'invalid_api_key' || status === 401) {
    return 'The interviewer is misconfigured. Please contact the administrator.';
  }
  if (status === 429) {
    return 'The interviewer is overloaded. Please wait a few seconds and try again.';
  }
  if (status >= 500) {
    return 'The interviewer is having a hiccup. Please try again in a moment.';
  }
  if (status === 400) {
    return 'The interviewer could not process that response. Try rephrasing.';
  }
  return 'The interviewer is unavailable right now. Please try again later.';
}

function parseOpenAIError(status: number, body: string): { code: string | null; type: string | null; message: string } {
  try {
    const j = JSON.parse(body) as { error?: { code?: string; type?: string; message?: string } };
    return {
      code: j.error?.code ?? null,
      type: j.error?.type ?? null,
      message: j.error?.message ?? body.slice(0, 300),
    };
  } catch {
    return { code: null, type: null, message: body.slice(0, 300) };
  }
}

const OPENAI_TIMEOUT_MS = 30000;
const OPENAI_RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

async function fetchOpenAI(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OPENAI_TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    if (!r.ok && OPENAI_RETRY_STATUSES.has(r.status) && attempt < 2) {
      const backoff = attempt === 0 ? 300 : 800;
      console.warn(`[openai] retrying after status ${r.status} (attempt ${attempt + 1})`);
      await new Promise((res) => setTimeout(res, backoff));
      return fetchOpenAI(url, init, attempt + 1);
    }
    return r;
  } catch (e) {
    if (attempt < 2) {
      const backoff = attempt === 0 ? 300 : 800;
      console.warn(`[openai] retrying after network/abort error (attempt ${attempt + 1})`, (e as Error).message);
      await new Promise((res) => setTimeout(res, backoff));
      return fetchOpenAI(url, init, attempt + 1);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Some model families (reasoning-tier models) reject legacy sampling params:
// `temperature` is unsupported, and `max_tokens` must be `max_completion_tokens`.
// Rather than hardcoding a model list that will rot as OpenAI ships new tiers,
// adapt to the API's own 400 unsupported-parameter response and retry - at most
// twice, one adaptation per param. Makes any model safe to set via env.
async function postChatAdaptive(apiKey: string, body: Record<string, unknown>): Promise<{ r: Response; text: string }> {
  let current: Record<string, unknown> = { ...body };
  for (let attempt = 0; ; attempt++) {
    const r = await fetchOpenAI(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(current),
    });
    const text = await r.text();
    if (r.ok || r.status !== 400 || attempt >= 2) return { r, text };
    const lower = text.toLowerCase();
    if (lower.includes('temperature') && 'temperature' in current) {
      console.warn('[openai] model rejected temperature - retrying without it', { model: current.model });
      const { temperature: _drop, ...rest } = current;
      current = rest;
      continue;
    }
    if (lower.includes('max_tokens') && 'max_tokens' in current) {
      console.warn('[openai] model rejected max_tokens - retrying with max_completion_tokens', { model: current.model });
      const { max_tokens: mt, ...rest } = current;
      current = { ...rest, max_completion_tokens: mt };
      continue;
    }
    return { r, text };
  }
}

export async function chatJSON<T>(opts: {
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  schemaName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ data: T; raw: string; tokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIError({
      status: 0, code: 'no_api_key', type: null, rawBody: '',
      message: 'OPENAI_API_KEY is not configured',
      friendly: 'The interviewer is misconfigured. Please contact the administrator.',
    });
  }
  const body = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 900,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: opts.schemaName,
        strict: true,
        schema: opts.schema,
      },
    },
  };
  const { r, text } = await postChatAdaptive(apiKey, body);
  if (!r.ok) {
    const parsed = parseOpenAIError(r.status, text);
    throw new OpenAIError({
      status: r.status,
      code: parsed.code,
      type: parsed.type,
      rawBody: text.slice(0, 800),
      message: `openai ${r.status} ${parsed.code ?? ''}: ${parsed.message}`,
      friendly: friendlyFromOpenAI(r.status, parsed.code, parsed.type),
    });
  }
  const j = JSON.parse(text) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };
  const raw = j.choices?.[0]?.message?.content ?? '';
  let parsed: T;
  try {
    parsed = JSON.parse(raw) as T;
  } catch (e) {
    throw new OpenAIError({
      status: 200, code: 'non_json_response', type: null, rawBody: raw.slice(0, 300),
      message: 'openai returned non-JSON: ' + raw.slice(0, 300),
      friendly: 'The interviewer gave an unreadable answer. Please try again.',
    });
  }
  return { data: parsed, raw, tokens: j.usage?.total_tokens ?? 0 };
}

export async function chatText(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIError({
      status: 0, code: 'no_api_key', type: null, rawBody: '',
      message: 'OPENAI_API_KEY is not configured',
      friendly: 'The interviewer is misconfigured. Please contact the administrator.',
    });
  }
  const body = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 900,
  };
  const { r, text: t } = await postChatAdaptive(apiKey, body);
  if (!r.ok) {
    const parsed = parseOpenAIError(r.status, t);
    throw new OpenAIError({
      status: r.status,
      code: parsed.code,
      type: parsed.type,
      rawBody: t.slice(0, 800),
      message: `openai ${r.status} ${parsed.code ?? ''}: ${parsed.message}`,
      friendly: friendlyFromOpenAI(r.status, parsed.code, parsed.type),
    });
  }
  const j = JSON.parse(t) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };
  return { text: j.choices?.[0]?.message?.content ?? '', tokens: j.usage?.total_tokens ?? 0 };
}
