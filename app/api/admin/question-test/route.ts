import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { chatJSON, OpenAIError } from '@/lib/openai';
import {
  TURN_SYSTEM_PROMPT,
  TURN_SCHEMA,
  buildTurnUserPrompt,
  type TurnAIResult,
  type TurnContext,
} from '@/lib/interview-prompts';
import { withLogging, logger } from '@/lib/observability';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NORMAL_MAX_FOLLOWUPS = 2;
const CASE_MAX_FOLLOWUPS = 5;

type Body = {
  question?: string;
  category?: string;
  subtopic?: string | null;
  difficulty?: number | null;
  level?: 'intern' | 'analyst' | 'associate';
  transcript?: TurnContext['transcript'];
  followUpsSoFar?: number;
  candidateMessage?: string;
};

function badRequest(reason: string) {
  return NextResponse.json({ error: reason }, { status: 400 });
}

export const POST = withLogging('POST /api/admin/question-test', async (request: Request, _ctx: { requestId: string }) => {
  // Admin-only. Editors do not get to spend tokens on the sandbox.
  const role = await getUserRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest('invalid_json');
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const subtopic = typeof body.subtopic === 'string' && body.subtopic.trim() ? body.subtopic.trim() : null;
  const difficulty = typeof body.difficulty === 'number' ? body.difficulty : null;
  const level = (['intern', 'analyst', 'associate'] as const).includes(body.level as 'intern') ? (body.level as TurnContext['level']) : 'analyst';
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  const followUpsSoFarRaw = typeof body.followUpsSoFar === 'number' ? body.followUpsSoFar : 0;
  const candidateMessage = typeof body.candidateMessage === 'string' ? body.candidateMessage.trim() : '';

  if (!question) return badRequest('question_required');
  if (!category) return badRequest('category_required');
  if (!candidateMessage) return badRequest('candidate_message_required');

  const isCase = category.toLowerCase() === 'case study';
  const maxFollowUps = isCase ? CASE_MAX_FOLLOWUPS : NORMAL_MAX_FOLLOWUPS;
  const followUpsSoFar = Math.max(0, Math.min(maxFollowUps, followUpsSoFarRaw));

  try {
    const out = await chatJSON<TurnAIResult>({
      schemaName: 'hardo_turn',
      schema: TURN_SCHEMA,
      messages: [
        { role: 'system', content: TURN_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildTurnUserPrompt({
            level,
            category,
            subtopic,
            difficulty,
            isCase,
            followUpsSoFar,
            maxFollowUps,
            question,
            transcript,
            candidateMessage,
          }),
        },
      ],
    });
    return NextResponse.json({
      ai: out.data,
      meta: { tokens: out.tokens, level, isCase, maxFollowUps, followUpsSoFar },
    });
  } catch (e) {
    if (e instanceof OpenAIError) {
      return NextResponse.json({ error: e.friendly, code: e.code, status: e.status }, { status: 502 });
    }
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: 'ai_call_failed', detail: msg }, { status: 500 });
  }
});
