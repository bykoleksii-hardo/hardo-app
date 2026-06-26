import { describe, it, expect } from 'vitest';
import { buildGradeBlockUserPrompt, type GradeBlockContext } from '@/lib/interview-prompts';

// These guard the core invariant of the block-grading fix: the candidate's BASE
// answer is presented as the PRIMARY evidence, ahead of the follow-ups, so the
// grader can no longer anchor on the last follow-up.
const baseCtx = (): GradeBlockContext => ({
  level: 'intern',
  category: 'Valuation',
  subtopic: null,
  difficulty: 2,
  isCase: false,
  rubricKind: 'technical',
  question: 'What is a DCF?',
  turns: [
    { question: null, answer: 'BASE_ANSWER_TEXT', score: 12, maxScore: 30, isFollowUp: false },
    { question: 'A follow up?', answer: 'FOLLOWUP_ANSWER_TEXT', score: 14, maxScore: 15, isFollowUp: true },
  ],
});

describe('buildGradeBlockUserPrompt', () => {
  it('labels the base answer PRIMARY and places it before the follow-ups', () => {
    const p = buildGradeBlockUserPrompt(baseCtx());
    const basePos = p.indexOf('BASE_ANSWER_TEXT');
    const fuPos = p.indexOf('FOLLOWUP_ANSWER_TEXT');
    expect(p).toContain('PRIMARY');
    expect(basePos).toBeGreaterThan(-1);
    expect(fuPos).toBeGreaterThan(-1);
    expect(basePos).toBeLessThan(fuPos);
  });

  it('surfaces per-answer scores and the follow-up section header', () => {
    const p = buildGradeBlockUserPrompt(baseCtx());
    expect(p).toContain('12 / 30');
    expect(p).toContain('FOLLOW-UP PROBES');
  });

  it('handles a base-only block (no follow-ups)', () => {
    const ctx = baseCtx();
    ctx.turns = [ctx.turns[0]];
    const p = buildGradeBlockUserPrompt(ctx);
    expect(p).toContain('none - the block closed on the base answer');
  });

  it('injects the confidential answer key only when provided', () => {
    const without = buildGradeBlockUserPrompt(baseCtx());
    expect(without).not.toContain('CONFIDENTIAL ANSWER KEY');

    const ctx = baseCtx();
    ctx.keyPoints = ['discount FCF at WACC', 'add a terminal value'];
    const withKey = buildGradeBlockUserPrompt(ctx);
    expect(withKey).toContain('CONFIDENTIAL ANSWER KEY');
    expect(withKey).toContain('discount FCF at WACC');
  });

  it('echoes the level and rubric kind for the grader', () => {
    const p = buildGradeBlockUserPrompt(baseCtx());
    expect(p).toContain('INTERVIEWER LEVEL: intern');
    expect(p).toContain('RUBRIC_KIND: technical');
  });
});
