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

  // ---- Block inversions: base-answer quality diverges from the LAST follow-up.
  // These are the cases the last-follow-up-anchored grader gets backwards. The
  // grade must track the BASE answer, not the final follow-up. Mirrors the real
  // intern interview that surfaced the bug.

  // WEAK base "why IB" rescued by strong follow-ups -> must stay a weak block.
  {
    id: 'whyib-weakbase-strongfu',
    level: 'intern',
    category: 'Behavioral',
    question: 'Why investment banking?',
    turns: [
      { answer: "I'm interested in investment banking because I want to learn a lot and it's a great opportunity. The pay is good and there are a lot of exit opportunities. I've always been interested in finance and I think banking would be a good fit for me. It's prestigious and I'd get to work with smart people." },
      { followUpQuestion: 'You mentioned wanting to learn a lot - what specific skills are you hoping to gain?', answer: 'Three things specifically. First, financial modeling and valuation rigor - building integrated three-statement models, LBOs and DCFs to the point where I can stress-test assumptions live. Second, deal execution mechanics - running a process end to end, diligence, drafting the CIM, coordinating with lawyers and accountants. Third, judgment around what drives value - how to frame strategic alternatives for a board and how financing structure affects feasibility.' },
      { followUpQuestion: 'Describe a specific aspect of deal execution that excites you most.', answer: "The due diligence and quality-of-earnings phase - pressure-testing whether the story in the CIM holds up in the numbers. In a corp dev internship I saw how a single normalization to EBITDA, like adding back a non-recurring legal settlement, could swing the implied purchase price by a couple of turns. It's where financial analysis meets detective work." },
    ],
    expect: { band: ['C', 'D'], axes: { correctness: [1, 2], depth: [0, 2] }, note: 'BASE is all cliche; strong FUs must not paper over it' },
  },

  // STRONG resume base, then lazy follow-ups -> must stay a solid block.
  {
    id: 'resume-strongbase-weakfu',
    level: 'intern',
    category: 'Behavioral',
    question: 'Walk me through your resume.',
    turns: [
      { answer: "I'm a junior at a target school majoring in finance with a 3.8 GPA. My interest in IB started during a sophomore-year internship at a boutique advisory firm, where I supported a sell-side process for a $40M manufacturing company - I built the data room index and helped scrub the working-capital adjustment in the QoE. Last summer I interned in corporate development at a mid-cap industrials company, where I built three-statement models to evaluate two bolt-on targets and ran a contribution-margin analysis that informed the go/no-go. I also lead our student fund's industrials team, where I pitched a roll-up long that's up 22%. The throughline: I want to be on the advisory side executing transactions." },
      { followUpQuestion: 'Elaborate on a specific challenge you faced during that internship and how you overcame it.', answer: "Honestly it was pretty challenging at times but I just worked hard and figured it out. There were a lot of late nights and the work was difficult, but I'm a hard worker so I pushed through. The main challenge was just getting used to everything. I overcame it by staying positive and asking questions." },
      { followUpQuestion: 'Share a specific example of a question you asked that helped you.', answer: "Yeah, I asked my manager a bunch of questions when I was confused. I don't remember a specific one exactly, but I made sure to ask whenever something didn't make sense. That helped me a lot. Asking questions is really important I think." },
    ],
    expect: { band: ['A', 'B'], axes: { correctness: [3, 4], depth: [2, 4] }, note: 'BASE is specific and strong; lazy FUs trim modestly, do not collapse it' },
  },

  // STRONG recent-deal base, then weak follow-ups -> must stay strong.
  {
    id: 'deal-strongbase-weakfu',
    level: 'intern',
    category: 'Behavioral',
    question: 'Tell me about a recent deal you read about and what you found interesting.',
    turns: [
      { answer: "Mars's acquisition of Kellanova - the Pringles and Cheez-It maker - for roughly $36 billion, announced in 2024. The strategic logic: Mars, a private family-owned company, using its balance sheet to build scale in salty snacks and diversify beyond confectionery and pet care, which strengthens its hand with retailers. The financing stood out - a large all-cash deal backed by committed bank financing in a higher-rate environment, signalling conviction. On valuation it was struck at a meaningful premium to the unaffected price and at an EBITDA multiple above where packaged-food comps traded, which raises the bar on synergies. And the antitrust angle made deal certainty and timeline real variables." },
      { followUpQuestion: 'How might the premium and regulatory scrutiny affect the deal timeline?', answer: "I think those factors could make it harder to close and maybe slow it down a bit. Regulators might look at it and a high price is always a bit risky. But big companies like Mars usually know what they're doing, so it'll probably work out fine in the end. Deals like this happen all the time." },
      { followUpQuestion: 'What specific actions might they take to address regulatory concerns?', answer: "I'm not totally sure on the specifics, but probably they'd talk to the regulators and explain why it's good. Maybe sell off a brand or two if they have to. Big companies have lawyers for this kind of thing so they'd handle it. I think mostly they just wait it out." },
    ],
    expect: { band: ['A', 'B'], axes: { correctness: [3, 4], depth: [2, 4] }, note: 'BASE names deal, size, thesis, valuation, antitrust; weak FUs trim only' },
  },

  // WEAK "EV/EBITDA vs equity/NI" base, strong bridge follow-up -> stays weak.
  {
    id: 'evebitda-weakbase-strongfu',
    level: 'intern',
    category: 'Valuation',
    question: 'Why do we use enterprise value with EBITDA but equity value with net income?',
    turns: [
      { answer: "I think it's just kind of the convention that people use. EBITDA goes with enterprise value and net income goes with equity value because that's how the multiples are usually set up, like EV/EBITDA and P/E. I'm not 100% sure on the deeper reason but I know you're supposed to match them and not mix them up. If you used the wrong one the multiple would be off. So mostly I just remember the pairings." },
      { followUpQuestion: 'Explain what happens if you mix them up and why that matters.', answer: "The real reason is matching the metric to the capital providers it belongs to. Enterprise value covers all investors, debt and equity. EBITDA, EBIT and unlevered FCF are pre-interest, so they're available to all capital providers - they pair with EV. Net income is after interest, so it belongs to equity holders only and pairs with equity value. Mixing them, like EV over net income, compares a whole-firm numerator to an equity-only denominator, so the multiple is internally inconsistent and not comparable across differently-levered companies." },
    ],
    expect: { band: ['C', 'D'], axes: { correctness: [1, 2], depth: [0, 2] }, note: 'BASE is "just convention, not sure why"; strong FU must not lift to A' },
  },

  // WEAK DCF base, strong projection follow-ups -> stays weak.
  {
    id: 'dcf-weakbase-strongfu',
    level: 'intern',
    category: 'Valuation',
    question: 'What is a DCF and why would you use one to value a company?',
    turns: [
      { answer: "A DCF is when you look at a company's future cash and figure out what it's worth today. You add up the cash flows and that gives you the value. It's useful because it tells you what a company is worth based on the money it makes. People use it a lot because it's pretty accurate. You just project the cash flows out and then total them up to get the company's value." },
      { followUpQuestion: 'How would you determine those cash flow projections?', answer: "To be precise, in a DCF you project unlevered free cash flow and discount it back at WACC rather than just summing it. The projection is built bottom-up off the operating model: start with revenue from volume times price, grounded in historicals, guidance and market size; apply margin assumptions to get to EBIT; then bridge EBIT to unlevered FCF - tax-effect EBIT to NOPAT, add back D&A, subtract capex, adjust for the change in net working capital." },
      { followUpQuestion: 'What if your revenue growth assumptions are overly optimistic?', answer: "I'd pressure-test them: compare implied growth to market size and share - if it implies unrealistic share gains, that's a red flag - and benchmark against history, peers and analyst estimates. I'd also check the model is internally consistent: aggressive growth needs more capex, working capital and S&M, so if those don't scale the cash flows are doubly overstated. To fix it I'd taper the growth curve toward a sustainable rate and run a downside scenario." },
    ],
    expect: { band: ['C', 'D'], axes: { correctness: [1, 2], depth: [0, 2] }, note: 'BASE misses PV/discounting ("just total them up"); strong FUs must not lift to A' },
  },

  // STRONG terminal-value base, then weak follow-ups -> stays strong.
  {
    id: 'terminalvalue-strongbase-weakfu',
    level: 'intern',
    category: 'Valuation',
    question: 'Explain the two main ways to calculate terminal value and when each is more appropriate.',
    turns: [
      { answer: "Two methods. Gordon growth: take terminal-year unlevered FCF, grow it by a modest perpetual rate g, and divide by (WACC - g), so TV = FCF*(1+g)/(WACC-g); g has to be at or below long-run GDP/inflation because nothing outgrows the economy forever. Exit multiple: apply a market EV/EBITDA multiple to terminal-year EBITDA, reflecting what a buyer would pay. Exit multiple is more common in banking and LBO work because it's grounded in observable comps, but it imports current conditions into a far-future year; Gordon is the purer intrinsic approach and a good sanity check. In practice you compute both and cross-check - back out the implied growth from your exit multiple and vice versa - since terminal value usually drives most of the DCF." },
      { followUpQuestion: 'Which would you default to and why?', answer: "Yeah, so basically you just pick whichever one seems right for the situation. The exit multiple is usually fine. I'd probably just go with that one most of the time since it's more common. The growth one is okay too but I think people use the multiple more. Honestly they kind of give similar answers if you do them right." },
      { followUpQuestion: 'Give a scenario where Gordon growth is more appropriate than an exit multiple.', answer: "Hmm, maybe when you don't have a good multiple to use? Like if the company is kind of unique. I'm not really sure to be honest. I'd probably still just use the exit multiple and try to find some comps. But if there's really nothing comparable then I guess the growth one makes sense. That's about all I can think of." },
    ],
    expect: { band: ['A', 'B'], axes: { correctness: [3, 4], depth: [2, 4] }, note: 'BASE has both methods + formula + cross-check; weak FUs trim modestly' },
  },
];
