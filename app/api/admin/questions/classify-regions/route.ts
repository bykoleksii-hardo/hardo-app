import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { chatJSON } from '@/lib/openai';
import { withLogging, logger } from '@/lib/observability';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Region = 'US' | 'EMEA' | 'Global';

type Body = {
  batchSize?: number;
  onlyGlobal?: boolean;
  dryRun?: boolean;
  offset?: number;
};

const SYSTEM_PROMPT = [
  'You classify investment-banking interview questions by region.',
  '',
  'Regions:',
  '- US: question relies on US GAAP, SEC filings (10-K / 10-Q / 8-K / S-1 / proxy), US tax code (Section 382, NOL carryforwards, QSBS, Treasury Stock Method, IRS, ASC), US M&A specifics (Delaware law, MAC clauses as US-styled, RWI as US-styled), US capital markets venues (NYSE, Nasdaq), or names a US company / sector in a way that needs US-market knowledge.',
  '- EMEA: question relies on IFRS, UK Companies Act, UK Takeover Panel / scheme of arrangement, FCA / PRA / MiFID / ESMA, LSE / AIM, HMRC / stamp duty, or names a UK / EU company in a way that needs EMEA-market knowledge.',
  '- Global: universal IB technicals or behavioral questions that any candidate worldwide should answer the same way (DCF mechanics, WACC, comparable multiples, basic accounting under either standard, generic fit / motivation / case logic).',
  '',
  'When in doubt prefer Global. Only mark US or EMEA if the question would be answered DIFFERENTLY in another market or REQUIRES knowing US / EMEA-specific framework.',
].join('\n');

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['classifications'],
  properties: {
    classifications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'region'],
        properties: {
          id: { type: 'integer' },
          region: { type: 'string', enum: ['US', 'EMEA', 'Global'] },
        },
      },
    },
  },
};

type ClassifyResult = { classifications: { id: number; region: Region }[] };

export const POST = withLogging('POST /api/admin/questions/classify-regions', async (request: Request, _ctx: { requestId: string }) => {
  const role = await getUserRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Body = {};
  try { body = (await request.json()) as Body; } catch {}
  const batchSize = Math.max(1, Math.min(40, body.batchSize ?? 25));
  const onlyGlobal = body.onlyGlobal !== false;
  const dryRun = body.dryRun === true;
  const offset = Math.max(0, body.offset ?? 0);

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('questions')
    .select('id, category, subtopic, question, region')
    .order('id', { ascending: true })
    .range(offset, offset + batchSize - 1);
  if (onlyGlobal) query = query.eq('region', 'Global');

  const { data: rows, error: fetchErr } = await query;
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, nextOffset: null, done: true });
  }

  const lines = rows.map((r) => '[id=' + r.id + '] category=' + r.category + ' | subtopic=' + (r.subtopic ?? '-') + '\nQ: ' + r.question);
  const userPrompt = 'Classify each question below. Return one entry per id.\n\n' + lines.join('\n\n');

  let out;
  try {
    out = await chatJSON<ClassifyResult>({
      schemaName: 'hardo_classify',
      schema: SCHEMA,
      maxTokens: 2500,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'openai_error' }, { status: 500 });
  }

  const byId = new Map<number, Region>();
  for (const c of out.data.classifications) byId.set(c.id, c.region);

  const updates: { id: number; oldRegion: string; newRegion: Region }[] = [];
  for (const r of rows) {
    const next = byId.get(r.id);
    if (!next) continue;
    if (next === r.region) continue;
    updates.push({ id: r.id, oldRegion: r.region as string, newRegion: next });
  }

  if (!dryRun) {
    for (const u of updates) {
      await supabase.from('questions').update({ region: u.newRegion }).eq('id', u.id);
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: rows.length,
    classified: out.data.classifications.length,
    updates,
    tokens: out.tokens,
    nextOffset: offset + rows.length,
    done: rows.length < batchSize,
  });
});
