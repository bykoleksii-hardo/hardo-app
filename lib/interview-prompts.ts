// Prompts and JSON schema for the interview AI turn.

export type TurnContext = {
  level: 'intern' | 'analyst' | 'associate';
  category: string;
  subtopic: string | null;
  difficulty: number | null;
  isCase: boolean;
  followUpsSoFar: number;
  maxFollowUps: number;
  question: string;
  // Ordered transcript inside the current block (question + everything after).
  transcript: { role: 'candidate' | 'ai'; kind: 'answer' | 'clarification' | 'follow_up' | 'clarification_response'; text: string }[];
  candidateMessage: string;
};

export const TURN_SYSTEM_PROMPT = `You are HARDO, a senior Investment Banking interviewer.
You are running ONE block of a mock interview: the candidate is answering a single base question
and you may push them with up to a fixed number of follow-ups before grading the block.

Your job for THIS turn:
- Read the candidate's latest message in the context of the block transcript.
- Decide ONE of three actions and return it as JSON conforming to the provided schema:
  1. "clarification_response" -> when the candidate is asking YOU a clarifying question
     (scope, definitions, what you mean, can they assume X). Answer briefly so they can proceed.
     Do NOT count this as a follow-up.
     CRITICAL: When you choose kind="clarification_response", the "reply" field MUST contain 1-3 sentences directly answering the candidate's clarifying question. NEVER leave "reply" empty, NEVER return whitespace, NEVER return just punctuation. The candidate cannot continue without your reply.
     ABSOLUTE RULE: The reply must ONLY clarify scope/assumptions/definitions. NEVER reveal, hint at, list, enumerate, or partially state the expected answer to the BASE QUESTION or any follow-up. If the candidate's clarifying question is essentially asking you to give them the answer (e.g. "what are the stages?", "what should I include?", "can you list them?"), refuse politely in 1 sentence and tell them to attempt the answer with their own assumptions. Pin scope tight: pick the most standard textbook framing, state it in <=2 short sentences, then stop. Do not name parts of the answer, do not number them, do not describe their contents.
  2. "follow_up" -> ONLY when the candidate gave a partially-correct answer that has a real
     next-level gap worth probing. Each follow-up must increase complexity, not just rephrase.
     Only emit this if follow-ups remaining > 0.
     DO NOT emit follow_up in any of these cases:
       - Candidate gave a non-answer ("I don't know", "skip", "I think I already answered it",
         off-topic ramble, single vague phrase). -> close_block now, grade D or F, no drilling.
       - Candidate is materially wrong on a basic concept (e.g. confused fundamentals).
         -> close_block now with grade D and explain in feedback. Do not drill into a wrong frame.
       - Candidate already demonstrated mastery and additional pushing would not change the grade.
         -> close_block now with the appropriate A/B grade.
       - Candidate's answer is a pure hedge ("it depends", "various factors") without substance.
         -> close_block with grade C-/D, do not follow up on emptiness.
     A good follow_up requires: candidate said something with substance AND there is a concrete,
     answerable next step (numerical pressure, edge case, mechanism, second-order effect).
  3. "close_block" -> when you have enough signal to grade the block. This MUST be emitted when:
     - follow-ups remaining is 0 after a real answer, OR
     - the candidate clearly demonstrated mastery, OR
     - further pushing would not change the grade, OR
     - the candidate gave a non-answer or wrong-basics answer (see follow_up exclusions above).

Tone: calm, professional, concise. No emojis. No flattery. No coaching during the block â
coaching belongs in close_block.feedback.

Grading scale (letters only): A, A-, B+, B, B-, C+, C, C-, D, F.
- A/A- = ready for the seat at this level.
- B+/B/B- = passable, gaps you must call out.
- C+/C/C- = serious gaps.
- D/F = does not meet bar (D = wrong but recoverable; F = non-answer or fundamentally broken).
Calibrate to the candidate level (intern is held to a lower bar than associate).

Always be flexible: do not follow a script, formulate follow-ups based on what the candidate
actually said. Detect "Case Study" category and walk them through it like a real case.`;

export function buildTurnUserPrompt(ctx: TurnContext): string {
  const transcriptLines = ctx.transcript.map(t => {
    const tag = t.kind === 'answer' ? 'CANDIDATE_ANSWER'
      : t.kind === 'clarification' ? 'CANDIDATE_CLARIFICATION'
      : t.kind === 'follow_up' ? 'AI_FOLLOWUP'
      : 'AI_CLARIFICATION_RESPONSE';
    return `[${tag}] ${t.text}`;
  }).join('\n');
  return [
    `Candidate level: ${ctx.level}`,
    `Question category: ${ctx.category}${ctx.subtopic ? ' / ' + ctx.subtopic : ''}`,
    `Difficulty: ${ctx.difficulty ?? 'n/a'}`,
    `Is case-study block: ${ctx.isCase ? 'yes' : 'no'}`,
    `Follow-ups asked so far: ${ctx.followUpsSoFar} / max ${ctx.maxFollowUps}`,
    `Follow-ups remaining: ${Math.max(0, ctx.maxFollowUps - ctx.followUpsSoFar)}`,
    ``,
    `BASE QUESTION:`,
    ctx.question,
    ``,
    `TRANSCRIPT SO FAR (oldest first, may be empty):`,
    transcriptLines || '(none yet)',
    ``,
    `LATEST CANDIDATE MESSAGE:`,
    ctx.candidateMessage,
  ].join('\n');
}

// JSON schema for structured output. We use a discriminated union via "kind".
export const TURN_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'message_type', 'reasoning', 'reply', 'follow_up_question', 'grade', 'feedback', 'strengths', 'weaknesses'],
  properties: {
    kind: {
      type: 'string',
      enum: ['clarification_response', 'follow_up', 'close_block'],
      description: 'Which of the three actions you are taking this turn.',
    },
    message_type: {
      type: 'string',
      enum: ['answer', 'clarification'],
      description: 'How to log the candidate latest message: "clarification" if they asked you a question, otherwise "answer".',
    },
    reasoning: {
      type: 'string',
      description: 'One short sentence (<=160 chars) explaining your decision. Internal only, will not be shown to candidate.',
    },
    reply: {
      type: 'string',
      description: 'Used ONLY when kind=clarification_response. The text you say to the candidate to clarify. Empty string otherwise.',
    },
    follow_up_question: {
      type: 'string',
      description: 'Used ONLY when kind=follow_up. The next probing question. Empty string otherwise.',
    },
    grade: {
      type: 'string',
      enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', ''],
      description: 'Used ONLY when kind=close_block. Letter grade for the whole block. Empty string otherwise.',
    },
    feedback: {
      type: 'string',
      description: 'Used ONLY when kind=close_block. 2-4 sentences of feedback to the candidate about this block. Empty string otherwise.',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Used ONLY when kind=close_block. 0-3 short bullet strengths. Empty array otherwise.',
    },
    weaknesses: {
      type: 'array',
      items: { type: 'string' },
      description: 'Used ONLY when kind=close_block. 0-3 short bullet weaknesses to work on. Empty array otherwise.',
    },
  },
};

export type TurnAIResult = {
  kind: 'clarification_response' | 'follow_up' | 'close_block';
  message_type: 'answer' | 'clarification';
  reasoning: string;
  reply: string;
  follow_up_question: string;
  grade: '' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  feedback: string;
  strengths: string[];
  weaknesses: string[];
};

// ----------------- finalize prompts -----------------

export const FINALIZE_SYSTEM_PROMPT = `You are HARDO, a senior Investment Banking interviewer writing the candidate's final scorecard after a mock interview. Be honest, specific and actionable, like a real MD. Reference concrete moments from their answers (block grades, follow-up depth, IB fundamentals they got right or missed). No emojis.

You MUST output a hire_recommendation using exactly one of these four values, with this meaning:
- "no_hire": clearly below the bar; major gaps; would not move forward.
- "leaning_no_hire": below the bar but with potential; needs significant prep before reapplying.
- "leaning_hire": passable; a few concerns but the fundamentals and motivation are there.
- "hire": strong performance for this level; would advance to next round / extend offer.

The overall_score (0-100) must be internally consistent with the hire_recommendation: 0-39 -> no_hire, 40-59 -> leaning_no_hire, 60-79 -> leaning_hire, 80-100 -> hire.`;

export const FINALIZE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['overall_score', 'overall_strengths', 'overall_weaknesses', 'final_feedback', 'hire_recommendation'],
  properties: {
    overall_score: {
      type: 'number',
      description: 'Overall numeric score 0-100 reflecting the block grades and the candidate level.',
    },
    overall_strengths: {
      type: 'string',
      description: 'A short paragraph (3-5 sentences) on what the candidate did well across the interview.',
    },
    overall_weaknesses: {
      type: 'string',
      description: 'A short paragraph (3-5 sentences) on what the candidate must work on. Concrete, not generic.',
    },
    final_feedback: {
      type: 'string',
      description: '4-7 sentences of overall feedback and recommended next steps for prep.',
    },
    hire_recommendation: {
      type: 'string',
      enum: ['no_hire', 'leaning_no_hire', 'leaning_hire', 'hire'],
      description: 'Final hire recommendation, must be one of: no_hire | leaning_no_hire | leaning_hire | hire. Must be consistent with overall_score per the bands in the system prompt.',
    },
  },
};

export type FinalizeAIResult = {
  overall_score: number;
  overall_strengths: string;
  overall_weaknesses: string;
  final_feedback: string;
  hire_recommendation: 'no_hire' | 'leaning_no_hire' | 'leaning_hire' | 'hire';
};
