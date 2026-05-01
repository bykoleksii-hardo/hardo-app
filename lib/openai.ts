// Minimal OpenAI Chat Completions wrapper used by interview turn / finalize.
// We talk to the public API directly so we keep the bundle tiny on Workers.

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function chatJSON<T>(opts: {
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  schemaName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ data: T; raw: string; tokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
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
    throw new Error(`openai ${r.status}: ${text.slice(0, 500)}`);
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
    throw new Error('openai returned non-JSON: ' + raw.slice(0, 300));
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
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
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
  if (!r.ok) throw new Error(`openai ${r.status}: ${t.slice(0, 500)}`);
  const j = JSON.parse(t) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };
  return { text: j.choices?.[0]?.message?.content ?? '', tokens: j.usage?.total_tokens ?? 0 };
}
