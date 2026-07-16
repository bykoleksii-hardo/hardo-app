// Pure constants/types — safe to import from client components.
// Do not add any server-only imports (e.g. next/headers, supabase server) here.
//
// Umbrella topics for topic sprints — grouped the way candidates actually think
// about prep, not by our internal question taxonomy. Each key resolves to a set
// of questions.category values inside start_topic_interview()
// (supabase/migrations/2026_43_topic_groups.sql) — the two mappings are mirrors
// of each other. interviews.topic_category stores the key; labels live here.

export const INTERVIEW_TOPICS = [
  { key: 'accounting', label: 'Accounting', blurb: 'Three statements, working capital, corporate finance mechanics.' },
  { key: 'valuation', label: 'Valuation', blurb: 'DCF, trading comps, precedents, and when the multiples disagree.' },
  { key: 'ma', label: 'M&A & Deals', blurb: 'Merger models, accretion / dilution, deal process, diligence.' },
  { key: 'lbo', label: 'LBO & Private Equity', blurb: 'Leverage mechanics, returns math, credit and restructuring.' },
  { key: 'markets', label: 'Markets & Brainteasers', blurb: 'Capital markets, market views, mental-math curveballs.' },
  { key: 'behavioral', label: 'Behavioral & Fit', blurb: 'Your story, why banking, and the pressure questions.' },
] as const;

export type TopicKey = (typeof INTERVIEW_TOPICS)[number]['key'];

export const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
  INTERVIEW_TOPICS.map((t) => [t.key, t.label])
);

export function isTopicKey(v: unknown): v is TopicKey {
  return typeof v === 'string' && INTERVIEW_TOPICS.some((t) => t.key === v);
}
