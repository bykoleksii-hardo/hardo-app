// Time limits per question category. v1: simple model — 60s for everything,
// 120s for the case study base question only. Follow-ups always 60s.
// Soft-fail: client shows red overtime indicator but never blocks submission.

export type QuestionCategory = string;

export function getTimeLimitSeconds(opts: {
  category: QuestionCategory | null | undefined;
  isFollowUp: boolean;
}): number {
  const cat = (opts.category ?? '').trim().toLowerCase();
  if (!opts.isFollowUp && cat === 'case study') return 120;
  return 60;
}
