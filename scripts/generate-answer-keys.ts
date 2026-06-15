/*
 * Batch-generate answer keys for the question bank.
 *
 * For each question it produces:
 *   - key_points: 4-6 must-hit points a strong answer covers (for grounding the
 *     grader's correctness and showing the candidate "what a strong answer covers")
 *   - model_answer: a tight exemplary answer shown on the scorecard
 *
 * Draft-then-curate: this writes AI drafts; review/edit them in admin before
 * relying on them for grading. Idempotent — skips questions that already have
 * key_points unless --regenerate is passed.
 *
 * Requires the 2026_18 migration applied, plus env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *
 * Usage:
 *   ...env npx tsx scripts/generate-answer-keys.ts              # fill missing
 *   ...env npx tsx scripts/generate-answer-keys.ts --limit 20   # first 20
 *   ...env npx tsx scripts/generate-answer-keys.ts --regenerate # overwrite all
 *   ...env npx tsx scripts/generate-answer-keys.ts --dry        # print, no writes
 */
import { createClient } from '@supabase/supabase-js';
import { chatJSON } from '../lib/openai';

const SYSTEM = `You are a senior investment-banking interviewer building an answer key for a mock-interview question bank. For the given question produce two things:

1. key_points: 4-6 concise, concrete points a STRONG answer must hit. Each <= 20 words, naming the specific mechanic/claim/step (e.g. "Unlever comp betas, take median, relever at target capital structure"), not meta ("be structured"). For BEHAVIORAL / FIT questions, key_points are the qualities/specifics a strong answer demonstrates (e.g. "Names a concrete deal or project with the candidate's own role", "Ties motivation to a specific skill they enjoy"), NOT facts to recite.

2. model_answer: a tight, exemplary answer of 120-200 words as a strong analyst would actually say it — concrete, leads with the answer, correct mechanics. For fit/behavioral, an illustrative strong answer (it's an example, not the only correct one).

Be technically correct and specific. No preamble, no markdown headers.`;

const SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['key_points', 'model_answer'],
  properties: {
    key_points: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string' },
      description: '4-6 must-hit points, each <= 20 words, concrete and specific.',
    },
    model_answer: {
      type: 'string',
      description: 'An exemplary 120-200 word answer as a strong analyst would give it.',
    },
  },
};

type Row = { id: number; question: string; category: string; subtopic: string | null; difficulty: number | null; key_points: unknown };

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'); process.exit(2); }
  if (!process.env.OPENAI_API_KEY) { console.error('Set OPENAI_API_KEY.'); process.exit(2); }

  const regenerate = process.argv.includes('--regenerate');
  const dry = process.argv.includes('--dry');
  const li = process.argv.indexOf('--limit');
  const limit = li >= 0 && process.argv[li + 1] ? Number(process.argv[li + 1]) : Infinity;

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from('questions')
    .select('id, question, category, subtopic, difficulty, key_points')
    .order('id', { ascending: true });
  if (error) { console.error('Query failed:', error.message); process.exit(1); }

  const rows = (data as Row[]).filter(r => regenerate || r.key_points == null).slice(0, limit);
  console.log(`${rows.length} question(s) to process${dry ? ' (dry run)' : ''}.\n`);

  let done = 0, failed = 0;
  for (const r of rows) {
    try {
      const out = await chatJSON<{ key_points: string[]; model_answer: string }>({
        schemaName: 'answer_key',
        schema: SCHEMA,
        temperature: 0.3,
        maxTokens: 700,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Category: ${r.category}${r.subtopic ? ' / ' + r.subtopic : ''}\nQuestion: ${r.question}` },
        ],
      });
      const kp = out.data.key_points?.filter(s => typeof s === 'string' && s.trim()) ?? [];
      const ma = (out.data.model_answer || '').trim();
      if (kp.length === 0 || !ma) { console.log(`  SKIP  #${r.id} (empty generation)`); failed++; continue; }
      if (dry) {
        console.log(`  #${r.id} [${r.category}] ${r.question.slice(0, 70)}`);
        console.log(`    key_points: ${kp.map(k => '\n      - ' + k).join('')}`);
        console.log(`    model_answer: ${ma.slice(0, 160)}...\n`);
      } else {
        const { error: upErr } = await sb.from('questions').update({ key_points: kp, model_answer: ma }).eq('id', r.id);
        if (upErr) { console.log(`  FAIL  #${r.id}: ${upErr.message}`); failed++; continue; }
        console.log(`  OK    #${r.id} [${r.category}] (${kp.length} key points)`);
      }
      done++;
    } catch (e) {
      console.log(`  ERROR #${r.id}: ${(e as Error).message}`);
      failed++;
    }
  }
  console.log(`\nDone: ${done} processed, ${failed} failed/skipped.`);
  process.exit(failed > 0 && done === 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
