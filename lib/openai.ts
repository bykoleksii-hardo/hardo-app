// Minimal OpenAI Chat Completions wrapper used by interview turn / finalize.
// We talk to the public API directly so we keep the bundle tiny on Workers.

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
    max_tokens: opts.maxTokens ?? 700,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: opts.schemaName,
        strict: true,
        schema: opts.schema,
      },
    },
  };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
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
    max_tokens: opts.maxTokens ?? 700,
  };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const t = await r.text();
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
