// Pure data for the comparison / "best tools" pages. No server imports.
// Competitor info reflects each platform's publicly stated features (their own
// sites / search) as of the date below. Kept factual and fair — we describe what
// rivals do well and where HARDO differs, rather than asserting unverified claims.

export const COMPARE_REVIEWED = 'June 2026';

export type CompareRow = { feature: string; hardo: string; rival: string };
export type Edge = { h: string; p: string };
export type QA = { q: string; a: string };

export type Comparison = {
  slug: string; // /compare/<slug>
  competitor: string;
  competitorUrl: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  pickHardoIf: string;
  pickRivalIf: string;
  rows: CompareRow[];
  hardoEdge: Edge[];
  rivalEdge: Edge[];
  faq: QA[];
};

const COMMON_ROWS = (rival: {
  format: string; grading: string; levels: string; delivery: string; modes: string; pricing: string; bestFor: string;
}): CompareRow[] => [
  { feature: 'Format', hardo: 'Full graded mock interview — 12 questions (technicals, behavioral, a case)', rival: rival.format },
  { feature: 'Grading', hardo: 'Letter grade per answer, six-axis skill radar, follow-up depth, a hire call', rival: rival.grading },
  { feature: 'Interviewer levels', hardo: 'Three tiers — Intern, Analyst, Associate — graded to each level’s bar', rival: rival.levels },
  { feature: 'Delivery scoring', hardo: 'Yes — pace, filler and jargon hygiene scored in voice mode', rival: rival.delivery },
  { feature: 'Voice & text', hardo: 'Both, same rubric either way', rival: rival.modes },
  { feature: 'Pricing', hardo: '$14.99/mo · one full interview free · no card', rival: rival.pricing },
  { feature: 'Best for', hardo: 'A brutally honest, repeatable interview rep with a real scorecard', rival: rival.bestFor },
];

export const COMPARISONS: Comparison[] = [
  {
    slug: 'hardo-vs-cookd-ai',
    competitor: 'Cook’d AI',
    competitorUrl: 'https://www.cookd.ai/',
    title: 'HARDO vs Cook’d AI — Which IB Interview Prep Is Right for You?',
    description: 'HARDO vs Cook’d AI for investment banking interview prep: a focused, brutally-graded AI mock interview vs an all-in-one recruiting suite. Features, pricing, and who each is for.',
    h1: 'HARDO vs Cook’d AI',
    intro: 'Both run AI investment banking mock interviews, but they aim at different jobs. Cook’d AI is a broad recruiting suite — interviews plus resume help, networking and an application tracker. HARDO is narrower and deeper: the interview itself, graded the way a real banker would, with delivery scored and three interviewer tiers.',
    pickHardoIf: 'you want the hardest, most honest interview rep — a real scorecard on every answer, delivery included — and transparent pricing.',
    pickRivalIf: 'you want one tool to manage the whole recruiting funnel (resume, networking, tracking) alongside practice.',
    rows: COMMON_ROWS({
      format: 'AI mock interviews plus technical/behavioral drills, inside a wider prep suite',
      grading: 'Answers graded against bank-style technical scorecards',
      levels: 'Not advertised as distinct interviewer tiers',
      delivery: 'Not advertised',
      modes: 'AI mock practice',
      pricing: 'Not publicly listed',
      bestFor: 'Managing the full recruiting process in one place (resume, networking, tracker)',
    }),
    hardoEdge: [
      { h: 'A real scorecard, not just a chat', p: 'Every answer gets a letter grade, a six-axis skill radar, the follow-up depth you held, and one of four hire calls — the verdict a director would write.' },
      { h: 'Tiered interviewers', p: 'Intern, Analyst and Associate rooms, each graded against the bar for that level instead of a generic one.' },
      { h: 'Delivery is scored', p: 'In voice mode, pace, filler and jargon hygiene are on the report — how you say it, not just whether the numbers tied.' },
      { h: 'Transparent pricing', p: 'One full interview free with no card, then $14.99/month. No funnel, no “contact us”.' },
    ],
    rivalEdge: [
      { h: 'Breadth', p: 'If you also want resume optimization, networking help and an application tracker in one subscription, Cook’d covers more of the funnel than HARDO does.' },
      { h: 'All-in-one workflow', p: 'Managing applications and prep in a single tool can suit candidates running a high-volume process.' },
    ],
    faq: [
      { q: 'Is HARDO a good Cook’d AI alternative?', a: 'Yes, if your priority is the interview itself. HARDO focuses on a graded, repeatable mock interview with a real scorecard and delivery scoring, rather than a broad recruiting suite.' },
      { q: 'Which is cheaper?', a: 'HARDO is $14.99/month with one full interview free and no card required. Cook’d AI’s pricing isn’t publicly listed at the time of writing — check their site.' },
      { q: 'Can I try HARDO free?', a: 'Yes — your first full mock interview is free, no card required.' },
    ],
  },
  {
    slug: 'hardo-vs-superday-ai',
    competitor: 'Superday AI',
    competitorUrl: 'https://www.superdayai.com/',
    title: 'HARDO vs Superday AI — IB Mock Interview Comparison',
    description: 'HARDO vs Superday AI for investment banking mock interviews: a graded practice rep with tiered interviewers and delivery scoring vs bank-specific coverage and a live interview copilot.',
    h1: 'HARDO vs Superday AI',
    intro: 'Both are AI investment banking mock interview tools. Superday AI leans on bank-specific question coverage and a real-time “interview copilot”. HARDO leans on the practice rep itself: three interviewer tiers, a director-style scorecard on every answer, and delivery scored in voice mode — built to make you better, not to assist you live.',
    pickHardoIf: 'you want to build the skill through honest, graded reps — with tiered interviewers and delivery feedback — at a transparent price.',
    pickRivalIf: 'you want broad bank-specific question coverage and a real-time copilot during interviews.',
    rows: COMMON_ROWS({
      format: 'Full-length mock interviews by target bank/role, plus a real-time interview copilot',
      grading: 'Scored feedback after each session; trained on real interview reports',
      levels: 'Tailored by target bank and role',
      delivery: 'Not advertised',
      modes: 'AI mock practice + live copilot',
      pricing: 'Not publicly listed',
      bestFor: 'Bank-specific question coverage and a live assist',
    }),
    hardoEdge: [
      { h: 'Graded like a real debrief', p: 'A letter grade per answer, a six-axis radar, follow-up depth and a hire call — so you know exactly where the bar is and what to drill next.' },
      { h: 'Three interviewer tiers', p: 'Intern, Analyst and Associate, each graded to that level’s bar — useful as you move from first-round to superday.' },
      { h: 'Delivery scoring', p: 'Pace, filler and jargon hygiene are on the report in voice mode, the way a real interviewer judges you.' },
      { h: 'Practice, not a crutch', p: 'HARDO is built to make you better before the interview — “practice against the bar, not a chatbot” — with clear $14.99/mo pricing and a free first interview.' },
    ],
    rivalEdge: [
      { h: 'Bank-specific coverage', p: 'Superday advertises questions across many named banks, which can help if you’re targeting a specific firm’s style.' },
      { h: 'Real-time copilot', p: 'If you specifically want a live assist feature, that’s part of Superday’s offering; HARDO deliberately focuses on graded preparation instead.' },
    ],
    faq: [
      { q: 'Is HARDO a good Superday AI alternative?', a: 'Yes, especially if you want a graded practice rep with tiered interviewers and delivery scoring rather than a real-time copilot.' },
      { q: 'Does HARDO grade my delivery?', a: 'Yes. In voice mode, pace, filler and jargon hygiene are scored alongside the technical content — not just whether the numbers tied.' },
      { q: 'Can I try HARDO free?', a: 'Yes — your first full mock interview is free, no card required.' },
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}

// Roundup entries for the "best AI IB mock interview tools" page. HARDO first
// (it's our site — stated plainly), then rivals with fair one-liners + links.
export type Tool = { name: string; url: string; internal?: boolean; line: string };

export const ROUNDUP_TOOLS: Tool[] = [
  { name: 'HARDO', url: '/ai-investment-banking-mock-interview', internal: true, line: 'A graded mock interview rep: 12 questions across technicals, behavioral and a case, three interviewer tiers, a letter grade on every answer and delivery scored in voice mode. One free, $14.99/mo.' },
  { name: 'Cook’d AI', url: 'https://www.cookd.ai/', line: 'An all-in-one recruiting suite — AI mock interviews plus resume help, networking and an application tracker.' },
  { name: 'Superday AI', url: 'https://www.superdayai.com/', line: 'AI mock interviews trained on real interview reports with bank-specific coverage, plus a real-time interview copilot.' },
  { name: 'IB Mock', url: 'https://www.ibmock.ai/', line: 'Voice-to-voice AI mock interviews with a large bank of curated, reported questions.' },
  { name: 'IB Prepared', url: 'https://www.ibprepared.com/interviews', line: 'AI mock interviews blended with technical quizzes and financial-modeling drills.' },
  { name: 'Banking Interview AI', url: 'https://bankinginterview.ai/', line: 'Voice-powered AI mock interviews with instant feedback on common IB questions.' },
];
