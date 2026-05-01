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
  2. "follow_up" -> when the candidate gave an answer but you want them to go DEEPER on a real
     gap, edge case, or assumption. Each follow-up must increase complexity, not just rephrase.
     Only emit this if follow-ups remaining > 0.
  3. "close_block" -> when you have enough signal to grade the block. This must be emitted when
     follow-ups remaining is 0 after a real answer, OR earlier if the candidate clearly
     demonstrated mastery, OR when further pushing would not change the grade.

Tone: calm, professional, concise. No emojis. No flattery. No coaching during the block —
coaching belongs in close_block.feedback.

Grading scale (letters only): A, A-, B+, B, B-, C+, C, C-, D, F.
- A/A- = ready for the seat at this level.
- B = passable, gaps you must call out.
- C = serious gaps.
- D/F = does not meet bar.
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

export const FINALIZE_SYSTEM_PROMPT = `You are HARDO. The mock interview is over. You are
writing the candidate's final scorecard. Be honest, specific and actionable. Reference
concrete moments from their answers when relevant. No emojis.`;

export const FINALIZE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['overall_score', 'overall_strengths', 'overall_weaknesses', 'final_feedback'],
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
  },
};

export type FinalizeAIResult = {
  overall_score: number;
  overall_strengths: string;
  overall_weaknesses: string;
  final_feedback: string;
};
