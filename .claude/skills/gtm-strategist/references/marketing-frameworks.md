# GTM & Marketing Frameworks — Hardo App playbooks

Deep reference for `gtm-strategist`. Frameworks adapted for Hardo App (AI IB mock
interview platform) from established marketing practice, including the open-source
Corey Haines marketing-skills set (MIT). Load when you need full detail on planning,
pricing, launch, research, or psychology.

---

## A. The AARRR marketing plan (13 sections)

Structure a full plan around the funnel. Each section: current state → 1-2 prioritized
bets → owner → metric → timeline.

1. **Foundation** — positioning, ICP, value-prop, brand (from `hardo-brand`).
2. **Acquisition · Organic content** — LinkedIn + FinTwit engine (`linkedin-*`/`twitter-*`).
3. **Acquisition · SEO/GEO** — "IB interview questions", "DCF walkthrough" (`seo`/`blog`).
4. **Acquisition · Community/Multiplier** — finance societies, career centers (B2B2C).
5. **Acquisition · Partnerships** — finance-career creators, newsletters, co-marketing.
6. **Acquisition · Paid** — only post message-fit; student/finance targeting.
7. **Activation · Onboarding** — fastest path to the aha (one full mock + feedback).
8. **Retention · Lifecycle** — email/streaks/new question sets/pre-interview cramming.
9. **Referral · Loops** — peer invites, shared practice sets, leaderboards.
10. **Revenue · Pricing & paywalls** — value-metric tiers, season pass, B2B2C.
11. **Brand & PR** — founder story, build-in-public, finance press/newsletters.
12. **Analytics & instrumentation** — Supabase events, North-Star, scorecard.
13. **Ops & cadence** — who does what, weekly rhythm, review against recruiting calendar.

Customize to **stage & budget**: pre-launch vs in-market; solo founder vs small team.

---

## B. Current-state audit rubric

Before planning, score each area Red / Yellow / Green with a one-line reason:
positioning clarity · ICP sharpness · website/conversion · onboarding-to-aha ·
retention mechanics · pricing/packaging · organic presence (LI/X) · SEO footprint ·
community/multiplier relationships · referral loop · analytics instrumentation ·
brand assets · content cadence · email list · proof/testimonials · competitive
differentiation · funnel leak (biggest single drop-off). The biggest Red that's
closest to revenue is usually the first thing to fix (Theory of Constraints).

---

## C. Pricing deep-dive

### Three pricing axes
1. **Packaging** — what's in each tier (features, limits, feedback depth).
2. **Value metric** — what you charge *per* (mocks, feedback depth, seats for B2B2C).
3. **Price point** — the actual number (set via research, not gut).

### Value-based pricing
Anchor to the value of landing an IB offer (life-changing comp), not to cost. The job
is worth a lot → prep that materially improves odds can command real price, *if*
framed against that stake. Keep a generous free tier for trial (zero-price effect).

### Good-Better-Best
- **Good (Free):** limited mocks, basic feedback — trial + virality + society reach.
- **Better (Paid):** unlimited mocks, deep specific feedback, full question bank,
  progress tracking — the core upgrade.
- **Best (Season Pass / Premium):** everything + extras (e.g. behavioral + technical
  tracks, mock "superdays"), time-boxed to the recruiting window.
- **B2B2C:** per-seat cohort access for societies/career centers.

### Willingness-to-pay research
- **Van Westendorp (4 questions):** at what price is it *too cheap* (doubt quality),
  *cheap* (bargain), *expensive* (give pause), *too expensive* (won't buy)? Plot to
  find an acceptable range.
- **MaxDiff:** force-rank features to see what people actually value (informs tiers).
- Run on real prospects (finance students) — never fabricate the numbers.

### When/how to raise prices
Signs: strong conversion, low price-objection, added value. Tactics: grandfather
existing users, raise for new users first, add a higher tier rather than lifting all.

---

## D. Launch playbook

### ORB channel model
- **Owned** — email/waitlist, founder & company profiles, the site, in-product.
- **Rented** — LinkedIn, X/FinTwit, Reddit, Discord, society channels.
- **Borrowed** — finance-career creators, society leaders' audiences, newsletters, press.
Plan every launch across all three; Owned compounds, Rented scales, Borrowed spikes.

### Five-phase launch
1. **Internal** — dogfood; fix the obvious.
2. **Alpha** — a handful of friendly candidates; watch them hit (or miss) the aha.
3. **Beta** — one finance society / cohort; gather VOC + testimonials (real ones).
4. **Early Access** — waitlist + scarcity; build anticipation into the recruiting window.
5. **Full Launch** — public moment, timed to peak demand (Aug-Oct).

### Product Hunt (optional public moment)
- Pros: spike of traffic, backlinks, credibility. Cons: audience skews builders, not
  finance students — treat as awareness/credibility, not core acquisition.
- Win it: line up supporters in advance, strong gallery + first comment (founder
  story), launch 12:01am PT, engage all day. Don't expect it to be the GTM by itself.

### Launch checklist (abbrev.)
Pre: positioning + landing page + analytics events + waitlist + assets + supporter
list. Day: publish across ORB, founder posts, reply everywhere, monitor signups.
Post: thank-yous, capture testimonials, convert waitlist, retro on what converted.

---

## E. Customer research toolkit

### Jobs-to-Be-Done
Interview/observe for the *progress* the candidate is trying to make and the anxiety
around it. Functional job (perform on technicals) + emotional (feel confident) +
social (not embarrass yourself, match peers).

### Watering holes (where this audience already talks)
r/FinancialCareers, Wall Street Oasis, university finance/investment societies,
LinkedIn comment threads of recruiters, prep Discords, YouTube interview-prep comments.

### Extraction + synthesis
For each source capture: pains, desired outcomes, objections, switching triggers, and
**exact phrases** (customer language). Rank themes by **frequency × intensity**.
Output: top 5 themes, verbatim quotes (real), and the copy angles they unlock.

---

## F. Marketing psychology toolkit (applied to Hardo)

**Thinking models:** First Principles (what actually makes a candidate pass?) · JTBD ·
Inversion (what guarantees they fail? avoid that) · Theory of Constraints (fix the
biggest funnel leak first) · 80/20 (which content/channel drives most signups?) ·
Second-order thinking (a society partnership compounds).

**Buyer psychology (use ethically):**
- **Zero-price effect** — free tier drives outsized trial; make it genuinely useful.
- **Endowment / IKEA effect** — accumulated reps & progress make Hardo "theirs".
- **Hyperbolic discounting + present bias** — deadlines convert; season pass & urgency.
- **Loss aversion** — frame the cost of walking in unprepared.
- **Social proof + mimetic desire** — peers/role-models prepping with Hardo.
- **Anchoring** — premium tier makes the core tier feel reasonable.
- **Status-quo bias** — the default is "just read WSO"; minimize friction to first mock.
- **Authority** — correct, sharp technical content signals credibility (brand guardrail).

Never manufacture false scarcity, fake proof, or job guarantees.

---

## G. Funding-stage capability unlocks

- **Bootstrapped / pre-seed:** founder-led organic (LI/X) + community/society outreach
  + freemium loop. Cheap, compounding. (Where Hardo likely is.)
- **Seed:** add content/SEO investment, a part-time growth hire, early paid tests,
  formal society partnership program.
- **Series A+:** scale paid, lifecycle/CRM, partnerships team, brand.
Match ambitions to the current stage; don't plan Series-A tactics on a pre-seed budget.

---

## H. North-Star & metric tree

- **NSM:** weekly completed mock interviews.
- **Inputs:** signups (Acq) → first mock completed (Act) → weekly mocks (Ret) →
  invites sent (Ref) → upgrades / passes sold (Rev).
- **Guardrails:** feedback-viewed rate, day-7 retention, paywall conversion, CAC vs
  payback. Review against the recruiting calendar; expect seasonal spikes.
