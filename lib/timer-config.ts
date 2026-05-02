// Time limits per question category, dependent on input mode.
// VOICE mode: 60s for everything except case study base which gets 120s. Follow-ups always 60s.
// TEXT  mode: 120s for everything except case study base which gets 180s. Follow-ups always 120s.
// Soft-fail: client shows red overtime indicator but never blocks submission.

export type QuestionCategory = string;
export type InputMode = 'text' | 'voice';

export function getTimeLimitSeconds(opts: {
  category: QuestionCategory | null | undefined;
  isFollowUp: boolean;
  inputMode?: InputMode | null;
}): number {
  const cat = (opts.category ?? '').trim().toLowerCase();
  const isCaseBase = !opts.isFollowUp && cat === 'case study';
  const mode: InputMode = opts.inputMode === 'voice' ? 'voice' : 'text';
  if (mode === 'voice') return isCaseBase ? 120 : 60;
  return isCaseBase ? 180 : 120;
}
