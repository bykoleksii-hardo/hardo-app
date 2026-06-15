import type { Level, LetterGrade } from '../../lib/interview-prompts';

// Golden set for measuring grader accuracy + consistency. Each case is a full
// interview block: the base answer plus optional follow-up exchanges. The
// runner feeds it through the SAME close_block prompt the product uses and
// checks the resulting rubric/letter against an expected band.
//
// `turns[0]` is the answer to the base question; later turns each carry the
// interviewer's follow-up question + the candidate's answer.

export type EvalTurn = { followUpQuestion?: string; answer: string };

export type EvalCase = {
  id: string;
  level: Level;
  category: string;
  question: string;
  turns: EvalTurn[];
  expect: {
    band: LetterGrade[]; // acceptable letters (graded letter must be one of these)
    axes?: Partial<Record<'correctness' | 'depth' | 'structure' | 'communication', [number, number]>>; // expected 0-4 ranges
    note?: string;
  };
};

export const CASES: EvalCase[] = [
  // ---- Technical: strong ----
  {
    id: 'acct-3stmt-strong',
    level: 'analyst',
    category: 'Accounting',
    question: 'Walk me through how the three statements connect.',
    turns: [{
      answer: 'Net income from the income statement flows into the top of the cash flow statement and into retained earnings on the balance sheet. On the cash flow you add back non-cash items like D&A, adjust for working-capital changes, then capture investing and financing. Ending cash from the cash flow ties to the cash line on the balance sheet, and the balance sheet must balance with equity carrying retained earnings.',
    }],
    expect: { band: ['A'], axes: { correctness: [3, 4], structure: [3, 4] }, note: 'clean, correct linkage' },
  },
  {
    id: 'dcf-walk-strong',
    level: 'analyst',
    category: 'Valuation',
    question: 'Walk me through a DCF.',
    turns: [{
      answer: 'Project unlevered free cash flow for five to ten years: EBIT times one minus tax, plus D&A, minus capex, minus the change in net working capital. Discount each year at WACC. Compute a terminal value via Gordon growth or an exit EV/EBITDA multiple, discount that back, sum to enterprise value, then bridge to equity value by subtracting net debt. I would sanity-check the implied terminal multiple against comps.',
    }],
    expect: { band: ['A'], axes: { correctness: [3, 4], depth: [2, 4] } },
  },
  {
    id: 'wacc-followup-strong',
    level: 'analyst',
    category: 'Valuation',
    question: 'How do you build a discount rate for a DCF?',
    turns: [
      { answer: 'WACC: weight the after-tax cost of debt and the cost of equity by their market-value weights. Cost of equity from CAPM — risk-free rate plus beta times the equity risk premium.' },
      { followUpQuestion: 'Where do you get beta, and what would you adjust?', answer: 'I would take levered betas of comparable public companies, unlever each by their debt-to-equity and tax, take the median asset beta, then relever at the target capital structure. That strips out financing differences across the comp set.' },
    ],
    expect: { band: ['A'], axes: { correctness: [3, 4], depth: [3, 4] } },
  },
  {
    id: 'lbo-walk-strong',
    level: 'associate',
    category: 'LBO',
    question: 'Walk me through an LBO and what makes a good candidate.',
    turns: [
      { answer: 'Sources and uses first: entry at some EV/EBITDA, funded with leverage — say 5x EBITDA of debt — and a sponsor equity plug. Project FCF, sweep it to pay down debt, exit in five years at an assumed multiple. Returns come from deleveraging, EBITDA growth, and multiple expansion. Good candidates have stable predictable cash flows, low capex intensity, a defensible market position, and a clear path to de-lever.' },
      { followUpQuestion: 'The CFO says leverage is too aggressive. Defend your structure.', answer: 'At 5x with EBITDA-to-interest above 2.5x and a cash sweep, the business covers its fixed charges through a downturn; I sized debt off through-cycle EBITDA, not peak. If covenants tighten I have a revolver for liquidity and can flex to 4.5x with more equity, which still clears our return hurdle.' },
    ],
    expect: { band: ['A'], axes: { correctness: [3, 4], depth: [3, 4], communication: [3, 4] } },
  },
  {
    id: 'valuation-methods-intern-clean',
    level: 'intern',
    category: 'Valuation',
    question: 'What are the main ways to value a company?',
    turns: [{
      answer: 'Three buckets: trading comparables — looking at multiples like EV/EBITDA of similar public companies; precedent transactions — multiples paid in past M&A deals, which include a control premium; and a DCF, the intrinsic value of projected cash flows. You triangulate across them.',
    }],
    expect: { band: ['A', 'B'], axes: { correctness: [3, 4] }, note: 'intern bar: framework + correct in spirit' },
  },

  // ---- Technical: mid ----
  {
    id: 'paper-lbo-mid',
    level: 'analyst',
    category: 'LBO',
    question: 'Walk me through a quick paper LBO.',
    turns: [{
      answer: 'Buy at some multiple with debt and equity, grow EBITDA a bit, pay down some debt, then exit at the same multiple and see the return. The equity grows because you paid down debt and EBITDA went up.',
    }],
    expect: { band: ['B'], note: 'right idea, no numbers / mechanics light' },
  },
  {
    id: 'accretion-dilution-mid',
    level: 'analyst',
    category: 'M&A',
    question: 'How do you tell if an acquisition is accretive or dilutive?',
    turns: [{
      answer: 'You compare the combined pro forma EPS to the acquirer standalone EPS. If the deal raises EPS it is accretive. Stock deals are more likely dilutive if the acquirer P/E is lower than the target P/E.',
    }],
    expect: { band: ['B'], note: 'correct but shallow, no financing nuance' },
  },
  {
    id: 'comps-vs-precedents-mid',
    level: 'analyst',
    category: 'Valuation',
    question: 'When would you trust precedent transactions over trading comps?',
    turns: [{
      answer: 'Precedents include a control premium so they run higher; I would lean on them when valuing a control acquisition. Trading comps reflect minority public values. I guess it depends on the deal context.',
    }],
    expect: { band: ['B'], axes: { depth: [1, 3] } },
  },

  // ---- Technical: weak ----
  {
    id: 'dcf-discount-rate-asserted',
    level: 'analyst',
    category: 'Valuation',
    question: 'How did you arrive at the discount rate in your DCF?',
    turns: [{
      answer: 'I used around 10% because that felt reasonable for this kind of company. It seemed like a normal rate to discount the cash flows.',
    }],
    expect: { band: ['C', 'D'], axes: { correctness: [0, 2], depth: [0, 1] }, note: 'asserted, no WACC build-up' },
  },
  {
    id: 'terminal-value-confused',
    level: 'analyst',
    category: 'Valuation',
    question: 'What is terminal value and how do you calculate it?',
    turns: [{
      answer: 'Terminal value is the value at the end. You just multiply the last year cash flow by some big number to capture the rest, maybe like ten times or so. It is the leftover value after the projection.',
    }],
    expect: { band: ['C', 'D', 'F'], axes: { correctness: [0, 1] }, note: 'fundamentally confused' },
  },
  {
    id: 'nonanswer-idk',
    level: 'analyst',
    category: 'Accounting',
    question: 'If depreciation increases by 10, walk me through the three statements assuming a 40% tax rate.',
    turns: [{ answer: "I'm not really sure how that works, I don't remember the tax effects." }],
    expect: { band: ['F', 'D'], axes: { correctness: [0, 0] }, note: 'non-answer' },
  },

  // ---- Fit / behavioral ----
  {
    id: 'why-ib-strong',
    level: 'intern',
    category: 'Behavioral',
    question: 'Why investment banking?',
    turns: [{
      answer: 'Two reasons. First, the work itself: I built a DCF for a retail company in my valuation club and loved getting into the operating drivers and defending assumptions — banking does that on real deals at pace. Second, the apprenticeship: I want to learn from senior bankers on live M&A, build a rigorous skill set early, and the analyst seat is the steepest learning curve I know of.',
    }],
    expect: { band: ['A'], axes: { correctness: [3, 4], depth: [2, 4] }, note: 'fit rubric: substance + specificity' },
  },
  {
    id: 'why-ib-generic',
    level: 'intern',
    category: 'Behavioral',
    question: 'Why investment banking?',
    turns: [{
      answer: 'I think investment banking is a great opportunity to learn a lot and work with smart people. It is fast paced and challenging and I want to grow my finance skills and work hard.',
    }],
    expect: { band: ['C'], axes: { depth: [0, 1] }, note: 'all generic, no specifics' },
  },
  {
    id: 'resume-walk-strong',
    level: 'analyst',
    category: 'Behavioral',
    question: 'Walk me through your resume.',
    turns: [{
      answer: 'I studied finance at State, where I ran the student investment fund managing a 200k book. Last summer I interned in corporate development at a mid-cap industrial, where I built the model for a 50m bolt-on acquisition and sat in on diligence calls. That experience — seeing a deal from screening to LOI — is what pulled me toward sell-side advisory, and it is why I am here.',
    }],
    expect: { band: ['A', 'B'], axes: { correctness: [3, 4], structure: [3, 4] } },
  },
  {
    id: 'conflict-behavioral-strong',
    level: 'associate',
    category: 'Behavioral',
    question: 'Tell me about a time you disagreed with a senior team member.',
    turns: [{
      answer: 'On a diligence project, my VP wanted to use a 12% growth assumption from management. I had pulled the segment data and thought it was 200bps too high versus the comparable run-rate. I did not push back in the room — afterward I built a sensitivity showing the equity-value swing and a one-pager benchmarking the assumption against peers. He agreed, we took it to 10%, and it held up with the client. The lesson was to disagree with evidence, privately first.',
    }],
    expect: { band: ['A'], axes: { depth: [3, 4], structure: [3, 4], communication: [3, 4] }, note: 'clean STAR, quantified, judgment' },
  },
  {
    id: 'deal-vague',
    level: 'analyst',
    category: 'Behavioral',
    question: 'Walk me through a recent deal you find interesting.',
    turns: [{
      answer: 'There was a big tech acquisition recently that I thought was interesting. It was a large deal and there was a lot of news about it. I think it made sense strategically for them to do it.',
    }],
    expect: { band: ['C'], axes: { depth: [0, 1] }, note: 'no names, no numbers, no thesis' },
  },
];
