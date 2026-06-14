---
name: linkedin-analytics
description: >
  Measure and report LinkedIn performance for Hardo App: which metrics matter,
  how to read them, competitor/benchmark analysis, and building simple performance
  reports and content scorecards. Use when the user asks about metrics, analytics,
  reporting, what's working, competitor analysis, or KPIs. Load hardo-brand first.
  Triggers: analytics, metrics, report, KPI, performance, what's working,
  competitor analysis, benchmark, scorecard.
---

# LinkedIn Analytics & Reporting for Hardo App

Measure what moves the goal (signups & qualified reach), not vanity. Apply
`hardo-brand` for audience/positioning context.

## Metrics that matter (in priority order)

1. **Signups / clicks driven** (north star) — track via the first-comment link
   using a UTM tag, e.g. `?utm_source=linkedin&utm_medium=social&utm_campaign=<name>`.
   (Hardo runs on Cloudflare + Supabase — confirm signups in your analytics/DB.)
2. **Saves** — strongest proxy for "this was genuinely useful"; high saves =
   reusable, repurpose-worthy content.
3. **Comments / meaningful conversations** — relationship + algorithm fuel.
4. **Profile views & follower growth** — leading indicator of authority building.
5. **Impressions & reach** — context, not a goal on its own.
6. **Engagement rate** = (reactions + comments + shares + saves) / impressions.
   Benchmark: ~2-3% is solid on LinkedIn; >5% is strong.

Vanity-trap: chasing impressions/likes while signups and saves stay flat.

## Where to get the data

- **Post analytics:** each post → "View analytics" (impressions, reactions,
  comments, reshares; demographics of viewers).
- **Profile/Creator analytics:** profile → Analytics (followers, profile views,
  search appearances, audience demographics).
- **Company Page:** Page Admin → Analytics.
- **Signups:** UTM links + Hardo's own analytics / Supabase.
- LinkedIn doesn't show "saves" directly to everyone — infer from save-CTA posts
  and reach lift; track manually if needed.

## Content scorecard (per post)

Maintain a simple table to learn what works:
```
| Date | Pillar | Format | Hook type | Impressions | Eng.rate | Saves | Comments | Clicks | Signups | Keep/Kill |
```
Review every 2 weeks. Promote what wins (more of that pillar/format/hook), cut what
flops. Most accounts find 1-2 formats carry the results — double down.

## Performance report (when asked to "report")

Produce a tight summary:
1. **Period & goal** (and the one north-star metric).
2. **Headline numbers** vs previous period (followers, impressions, eng. rate,
   clicks, signups) — % change.
3. **Top 3 posts** (what they had in common) and **bottom 2** (why they missed).
4. **What it means** — 2-3 insights, not raw data.
5. **Next actions** — concrete changes for next period (pillars/formats/cadence).
Keep it to a one-screen brief; lead with insight, not tables.

## Competitor / benchmark analysis

When analyzing competitors (other interview-prep / finance-career brands & creators):
- Map their **pillars, formats, cadence, and best-performing posts** (by visible
  engagement).
- Identify **gaps** Hardo can own (e.g. they post motivation but not real technical
  reps → Hardo wins on "specific feedback + reps").
- Note their hooks and CTAs; adapt patterns, don't copy.
- Output: a short brief — their strengths, their gaps, and **3 concrete openings for
  Hardo**.

## Honesty rules

- Report real numbers only; if data is missing, say so and show how to get it.
- No fabricated benchmarks — label any estimate as an estimate.
