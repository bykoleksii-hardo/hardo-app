// Pure constants/types — safe to import from client components.
// Do not add any server-only imports (e.g. next/headers, supabase server) here.
//
// Topic-sprint categories. These strings must exactly match questions.category
// values in the DB and the whitelist inside start_topic_interview()
// (supabase/migrations/2026_42_topic_interviews.sql) — the three lists are
// mirrors of each other.

export const TOPIC_CATEGORIES = [
  'Accounting',
  'Valuation',
  'M&A',
  'Private Equity / LBO',
  'Corporate Finance',
  'Capital Markets',
  'Restructuring',
  'Due Diligence',
  'Business Acumen / Markets',
  'Behavioral / Fit',
  'Case Study',
  'Brainteaser',
] as const;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

export function isTopicCategory(v: unknown): v is TopicCategory {
  return typeof v === 'string' && (TOPIC_CATEGORIES as readonly string[]).includes(v);
}

// Topics whose question pool only starts at a higher candidate level.
// Restructuring has too few intern-level questions to fill a 3-question sprint
// (and isn't realistically asked at intern superdays anyway).
export const TOPIC_MIN_LEVEL: Partial<Record<TopicCategory, 'analyst'>> = {
  Restructuring: 'analyst',
};
