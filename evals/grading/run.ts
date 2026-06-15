/*
 * Grading eval harness. Runs each golden case through the SAME close_block
 * prompt + temperature the product uses, derives the block letter from the
 * rubric, and checks it against the expected band. Measures accuracy and
 * (with --runs N) run-to-run consistency.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx evals/grading/run.ts
 *   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4o npx tsx evals/grading/run.ts --runs 3
 *
 * Exit code is non-zero if the pass rate is below --min (default 0.7), so it
 * can gate CI.
 */
import {
  TURN_SYSTEM_PROMPT,
  TURN_SCHEMA,
  buildTurnUserPrompt,
  rubricKindForCategory,
  rubricToPct,
  percentToLetter,
  isValidRubric,
  maxScoreForTurn,
  GRADING_TEMPERATURE,
  type TurnAIResult,
  type TurnContext,
  type LetterGrade,
} from '../../lib/interview-prompts';
import { chatJSON } from '../../lib/openai';
import { CASES, type EvalCase } from './dataset';

const ORDER: LetterGrade[] = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
const idx = (g: LetterGrade) => { const i = ORDER.indexOf(g); return i < 0 ? ORDER.length : i; };
const bandDistance = (got: LetterGrade, band: LetterGrade[]) => Math.min(...band.map(b => Math.abs(idx(got) - idx(b))));

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : def;
};
const RUNS = Math.max(1, arg('--runs', 1));
const MIN_PASS = arg('--min', 0.7);

function buildContext(c: EvalCase): TurnContext {
  const transcript: TurnContext['transcript'] = [];
  c.turns.forEach((t, i) => {
    if (i > 0 && t.followUpQuestion) transcript.push({ role: 'ai', kind: 'follow_up', text: t.followUpQuestion });
    if (i < c.turns.length - 1) transcript.push({ role: 'candidate', kind: 'answer', text: t.answer });
  });
  const isCase = c.category.toLowerCase() === 'case study';
  const maxFollowUps = isCase ? 5 : 2;
  // Force a close_block (limit reached) so the grader returns a rubric.
  const followUpsSoFar = maxFollowUps;
  return {
    level: c.level,
    category: c.category,
    subtopic: null,
    difficulty: null,
    isCase,
    rubricKind: rubricKindForCategory(c.category),
    followUpsSoFar,
    maxFollowUps,
    maxScoreForThisTurn: maxScoreForTurn(followUpsSoFar, isCase),
    question: c.question,
    transcript,
    candidateMessage: c.turns[c.turns.length - 1].answer,
  };
}

async function gradeOnce(c: EvalCase): Promise<{ letter: LetterGrade; rubric: TurnAIResult['rubric'] | null } | null> {
  const out = await chatJSON<TurnAIResult>({
    schemaName: 'hardo_turn',
    schema: TURN_SCHEMA,
    temperature: GRADING_TEMPERATURE,
    maxTokens: 1500,
    messages: [
      { role: 'system', content: TURN_SYSTEM_PROMPT },
      { role: 'user', content: buildTurnUserPrompt(buildContext(c)) },
    ],
  });
  const r = (out.data as { rubric?: unknown }).rubric;
  if (!isValidRubric(r)) return null;
  const letter = percentToLetter(rubricToPct(r, rubricKindForCategory(c.category), c.level));
  return { letter, rubric: r };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Set OPENAI_API_KEY to run the grading eval.');
    process.exit(2);
  }
  console.log(`Grading eval — ${CASES.length} cases × ${RUNS} run(s), temp=${GRADING_TEMPERATURE}, model=${process.env.OPENAI_MODEL || 'gpt-4o-mini'}\n`);

  let passes = 0, total = 0, distSum = 0;
  let axisChecks = 0, axisHits = 0;
  const fails: string[] = [];

  for (const c of CASES) {
    const letters: LetterGrade[] = [];
    let lastRubric: TurnAIResult['rubric'] | null = null;
    for (let run = 0; run < RUNS; run++) {
      try {
        const res = await gradeOnce(c);
        if (!res) { fails.push(`${c.id}: no rubric returned`); continue; }
        letters.push(res.letter);
        lastRubric = res.rubric;
      } catch (e) {
        fails.push(`${c.id}: error ${(e as Error).message}`);
      }
    }
    if (letters.length === 0) { total++; continue; }

    // A case passes if the modal letter is within the expected band.
    const counts: Record<string, number> = {};
    for (const l of letters) counts[l] = (counts[l] || 0) + 1;
    const modal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as LetterGrade;
    const inBand = c.expect.band.includes(modal);
    const dist = bandDistance(modal, c.expect.band);
    const distinct = Object.keys(counts).length;
    total++; distSum += dist;
    if (inBand) passes++; else fails.push(`${c.id}: got ${modal} (${letters.join('/')}), expected ${c.expect.band.join('|')}`);

    // Axis checks against the last rubric.
    let axisStr = '';
    if (c.expect.axes && lastRubric) {
      const parts: string[] = [];
      for (const [ax, range] of Object.entries(c.expect.axes)) {
        const v = (lastRubric as Record<string, number>)[ax];
        const [lo, hi] = range as [number, number];
        const ok = typeof v === 'number' && v >= lo && v <= hi;
        axisChecks++; if (ok) axisHits++;
        parts.push(`${ax}=${v}${ok ? '✓' : `✗(${lo}-${hi})`}`);
      }
      axisStr = '  ' + parts.join(' ');
    }

    const tag = inBand ? 'PASS' : 'FAIL';
    const consistency = RUNS > 1 ? `  [${distinct} distinct/${RUNS}]` : '';
    console.log(`  ${tag}  ${c.id.padEnd(28)} got ${String(modal).padEnd(3)} exp ${c.expect.band.join('|').padEnd(10)} d=${dist}${consistency}${axisStr}`);
  }

  const passRate = total > 0 ? passes / total : 0;
  console.log(`\nBand accuracy: ${passes}/${total} (${(passRate * 100).toFixed(0)}%)  ·  mean band-distance: ${(distSum / Math.max(1, total)).toFixed(2)}`);
  if (axisChecks > 0) console.log(`Axis-range accuracy: ${axisHits}/${axisChecks} (${((axisHits / axisChecks) * 100).toFixed(0)}%)`);
  if (fails.length) { console.log('\nMisses:'); for (const f of fails) console.log('  - ' + f); }

  process.exit(passRate >= MIN_PASS ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
