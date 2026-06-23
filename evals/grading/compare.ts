/*
 * Before/after harness for the block-grading fix.
 *
 * Grades every dataset case TWO ways on the same model and prints a table:
 *   OLD  = the per-turn close_block prompt, scored off the candidate's LAST
 *          message (on a multi-turn block, the final follow-up). This is the
 *          path that graded a cliche base answer rescued by a strong follow-up
 *          as an A, and a strong base answer trailed by a lazy follow-up as a C.
 *   NEW  = the dedicated holistic pass that anchors the grade on the BASE answer
 *          and treats follow-ups as secondary adjusters.
 *
 * The letter is derived the same way the eval/runner does: rubric -> rubricToPct
 * -> percentToLetter. Cases whose `expect.band` reflects the BASE answer reveal
 * the difference: OLD misses the inversion cases, NEW should track the base.
 *
 * Usage (same model both sides isolates the architecture change):
 *   OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai \
 *   OPENAI_API_KEY=$GEMINI_API_KEY OPENAI_MODEL=gemini-2.5-flash \
 *   node compare.mjs [idFilter]
 */
import {
  TURN_SYSTEM_PROMPT,
  TURN_SCHEMA,
  buildTurnUserPrompt,
  GRADE_BLOCK_SYSTEM_PROMPT,
  GRADE_BLOCK_SCHEMA,
  buildGradeBlockUserPrompt,
  rubricKindForCategory,
  rubricToPct,
  percentToLetter,
  isValidRubric,
  maxScoreForTurn,
  GRADING_TEMPERATURE,
  type TurnContext,
  type GradeBlockContext,
  type GradeBlockTurn,
  type LetterGrade,
} from '../../lib/interview-prompts';
import { chatJSON } from '../../lib/openai';
import { CASES, type EvalCase } from './dataset';

const SLEEP_MS = Number(process.env.EVAL_SLEEP_MS || 700);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- OLD: per-turn close_block, anchored on the last message ----
function buildTurnContext(c: EvalCase): TurnContext {
  const transcript: TurnContext['transcript'] = [];
  c.turns.forEach((t, i) => {
    if (i > 0 && t.followUpQuestion) transcript.push({ role: 'ai', kind: 'follow_up', text: t.followUpQuestion });
    if (i < c.turns.length - 1) transcript.push({ role: 'candidate', kind: 'answer', text: t.answer });
  });
  const isCase = c.category.toLowerCase() === 'case study';
  const maxFollowUps = isCase ? 5 : 2;
  const followUpsSoFar = maxFollowUps; // force a close_block so the grader returns a rubric
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

async function gradeOld(c: EvalCase): Promise<LetterGrade | null> {
  const out = await chatJSON<{ rubric?: unknown }>({
    schemaName: 'hardo_turn',
    schema: TURN_SCHEMA,
    temperature: GRADING_TEMPERATURE,
    // Generous ceiling: reasoning-style eval models (e.g. gemini-2.5-flash) spend
    // output tokens "thinking" before the JSON, so a prod-sized cap truncates it.
    maxTokens: Number(process.env.EVAL_MAX_TOKENS || 3000),
    messages: [
      { role: 'system', content: TURN_SYSTEM_PROMPT },
      { role: 'user', content: buildTurnUserPrompt(buildTurnContext(c)) },
    ],
  });
  const r = out.data.rubric;
  if (!isValidRubric(r)) return null;
  return percentToLetter(rubricToPct(r, rubricKindForCategory(c.category), c.level));
}

// ---- NEW: dedicated holistic block grade, base answer primary ----
function buildGradeCtx(c: EvalCase): GradeBlockContext {
  const isCase = c.category.toLowerCase() === 'case study';
  const turns: GradeBlockTurn[] = c.turns.map((t, i) => ({
    question: i === 0 ? null : (t.followUpQuestion ?? ''),
    answer: t.answer,
    score: null,
    maxScore: maxScoreForTurn(i, isCase),
    isFollowUp: i > 0,
  }));
  return {
    level: c.level,
    category: c.category,
    subtopic: null,
    difficulty: null,
    isCase,
    rubricKind: rubricKindForCategory(c.category),
    question: c.question,
    turns,
  };
}

async function gradeNew(c: EvalCase): Promise<LetterGrade | null> {
  const out = await chatJSON<{ rubric?: unknown }>({
    schemaName: 'hardo_grade_block',
    schema: GRADE_BLOCK_SCHEMA,
    temperature: GRADING_TEMPERATURE,
    maxTokens: Number(process.env.EVAL_MAX_TOKENS || 3000),
    messages: [
      { role: 'system', content: GRADE_BLOCK_SYSTEM_PROMPT },
      { role: 'user', content: buildGradeBlockUserPrompt(buildGradeCtx(c)) },
    ],
  });
  const r = out.data.rubric;
  if (!isValidRubric(r)) return null;
  return percentToLetter(rubricToPct(r, rubricKindForCategory(c.category), c.level));
}

const inBand = (g: LetterGrade | null, band: LetterGrade[]) => g != null && band.includes(g);
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Set OPENAI_API_KEY (point OPENAI_BASE_URL/OPENAI_MODEL at any OpenAI-compatible endpoint).');
    process.exit(2);
  }
  const filter = process.argv[2];
  // The 6 cases where base-answer quality diverges from the last follow-up — the
  // ones that expose the bug. `node compare.mjs inversions` runs just these.
  const INVERSION_IDS = new Set([
    'whyib-weakbase-strongfu', 'resume-strongbase-weakfu', 'deal-strongbase-weakfu',
    'evebitda-weakbase-strongfu', 'dcf-weakbase-strongfu', 'terminalvalue-strongbase-weakfu',
  ]);
  const cases = filter === 'inversions'
    ? CASES.filter((c) => INVERSION_IDS.has(c.id))
    : filter ? CASES.filter((c) => c.id.includes(filter)) : CASES;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  console.log(`Block grading — OLD (last-follow-up-anchored) vs NEW (holistic, base-primary)`);
  console.log(`model=${model}  temp=${GRADING_TEMPERATURE}  multi-turn cases drive the delta\n`);
  console.log(pad('case', 34) + pad('turns', 6) + pad('exp', 9) + pad('OLD', 6) + pad('NEW', 6) + 'verdict');
  console.log('-'.repeat(78));

  let oldPass = 0, newPass = 0, fixed = 0, regressed = 0, total = 0;
  for (const c of cases) {
    let og: LetterGrade | null = null;
    let ng: LetterGrade | null = null;
    const mode = process.env.EVAL_MODE || 'both'; // both | old | new
    if (mode !== 'new') {
      try { og = await gradeOld(c); } catch (e) { console.error(`  [old ${c.id}] ${(e as Error).message}`); }
      await sleep(SLEEP_MS);
    }
    if (mode !== 'old') {
      try { ng = await gradeNew(c); } catch (e) { console.error(`  [new ${c.id}] ${(e as Error).message}`); }
      await sleep(SLEEP_MS);
    }

    const ob = inBand(og, c.expect.band);
    const nb = inBand(ng, c.expect.band);
    total++; if (ob) oldPass++; if (nb) newPass++;
    let verdict = 'both ok';
    if (!ob && nb) { verdict = 'FIXED'; fixed++; }
    else if (ob && !nb) { verdict = 'REGRESSED'; regressed++; }
    else if (!ob && !nb) verdict = 'both miss';
    console.log(
      pad(c.id, 34) + pad(String(c.turns.length), 6) + pad(c.expect.band.join('|'), 9) +
      pad(String(og ?? '—'), 6) + pad(String(ng ?? '—'), 6) + verdict,
    );
  }
  console.log('-'.repeat(78));
  console.log(`OLD in-band: ${oldPass}/${total}   NEW in-band: ${newPass}/${total}   fixed: ${fixed}   regressed: ${regressed}`);
}

main().catch((e) => { console.error(e); process.exit(2); });
