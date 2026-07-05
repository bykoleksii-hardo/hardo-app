---
name: linkedin-daily-rep
description: >
  Generate the daily "Daily Rep" LinkedIn post for Hardo App — a numbered,
  series-branded post built around ONE real investment-banking interview
  question per day, with a weekday category rotation and a 4-week topic
  curriculum. Use for the daily LinkedIn post task, the /li-daily command, or
  when the user asks for "today's post", "daily rep", or "post of the day".
  Always load hardo-brand and linkedin-content first. Triggers: daily rep,
  daily post, post of the day, li-daily, question of the day.
---

# «Daily Rep» — Hardo App daily LinkedIn format

One post per day. One real IB interview question per post. The series teaches
the audience to *do the rep* — answer out loud, today — which is exactly what
Hardo sells. **Always apply `hardo-brand` (voice, guardrails) and
`linkedin-content` (hooks, feed formatting).**

## Why this format

- **Recognizable series** → habitual readers, follows, saves ("Daily Rep #041").
- **Useful even if they never buy** → 80/20 value rule holds automatically.
- **Every post ends in an action** (answer it out loud) → natural bridge to
  running a mock on Hardo without a hard sell.

## Series mechanics

- **Numbering:** Rep #NNN = days since the series start **2026-07-06**
  (inclusive). 2026-07-06 → #001, 2026-07-07 → #002, etc. Zero-pad to 3 digits.
- **Language:** English (the audience is finance students recruiting for IB).
- **Length:** 120–200 words. Short lines. Link in first comment, never in body.
- **One question per post.** Never two. Depth over coverage.

## Weekday rotation (category → pillar)

| Day | Category | Pillar | Shape |
|-----|----------|--------|-------|
| Mon | **Technical Rep** | Teach | Core technical question, answer structure |
| Tue | **Behavioral Rep** | Teach | Fit/behavioral question, answer framework |
| Wed | **Trap of the Day** | Demystify | A question people get wrong + the wrong answer itself |
| Thu | **30-Second Drill** | Teach | One concept, explained clean in ≤30 seconds of speech |
| Fri | **Rebuild the Answer** | Teach/Confidence | Weak answer vs strong answer, side by side |
| Sat | **Recruiting Radar** | Demystify | How the process actually works (lighter read) |
| Sun | **Mindset Rep** | Confidence | Nerves, pressure, consistency (lightest; soft product tie allowed) |

## 4-week topic curriculum

Pick the slot for the current ISO week modulo 4 (week of 2026-07-06 = Week A,
next = B, then C, D, then back to A). **On repeat cycles you MUST use a
different specific question and a fresh hook angle within the same bucket** —
the bucket repeats, the post never does.

| Day | Week A | Week B | Week C | Week D |
|-----|--------|--------|--------|--------|
| Mon | Walk me through a DCF | DCF vs comps vs precedents (football field) | Walk me through an LBO | Accretion / dilution — when and why |
| Tue | Why investment banking? | Why this bank? | Team / leadership under pressure | Walk me through your resume |
| Wed | Depreciation +$10 through the 3 statements — the classic slips | Can equity value be negative? Can EV? | Why not EV/Earnings or P/EBITDA? (multiples consistency) | Company raises $100 of debt — what happens to EV? |
| Thu | Enterprise value vs equity value | WACC — what it is, why it matters | Levered vs unlevered free cash flow | Levering / unlevering beta — why bother |
| Fri | "Tell me about yourself" | "What's your greatest weakness?" | "Why should we hire you?" | "Do you have any questions for us?" |
| Sat | What round 1 actually screens for | Coffee chats that convert to referrals | Superday anatomy — who you meet, what each round tests | Off-cycle & spring weeks — the overlooked routes |
| Sun | The blank-mind moment — a recovery structure | Comparing yourself to peers on LinkedIn | Rejection ≠ verdict — the base-rate reframe | Consistency beats cramming — the reps mindset |

If the user passes an explicit topic, it overrides the grid but keeps the
day's category shape and the series numbering.

## Post skeleton (fill, don't deviate)

```
[HOOK — 1-2 lines, curiosity or stakes. Follow linkedin-content hook rules.]

Daily Rep #NNN — [Category name]

The question:
"[exact interview question, quoted]"

Why they ask it:
[1-2 lines — what signal the interviewer is really extracting]

The strong answer (structure, not a script):
→ [step / point 1]
→ [step / point 2]
→ [step / point 3, max 4]

Where candidates lose points:
[1-2 lines — the single most common mistake]

Your rep: answer it out loud. 60 seconds. No notes.

[CTA — rotate per hardo-brand; "(link in comments)" when using the direct CTA]

[3-5 niche hashtags]
```

Category-specific tweaks:
- **Trap of the Day (Wed):** show the *wrong* answer first ("Most candidates
  say X. That's wrong."), then the correction.
- **Rebuild the Answer (Fri):** replace the structure block with
  `❌ Weak answer:` (2-3 lines) then `✅ Strong answer:` (3-4 lines).
- **30-Second Drill (Thu):** the structure block becomes the actual 30-second
  spoken answer, written to be read aloud. Optionally suggest running it as a
  LinkedIn poll variant.
- **Sat/Sun:** the "question" block may become the situation ("It's the night
  before your superday…"); keep the skeleton's rhythm.

## Hard rules

- Technical accuracy is non-negotiable — a wrong DCF explanation kills the
  brand. If unsure, simplify rather than risk an error.
- No fabricated stats, quotes, or outcomes; no job guarantees (see hardo-brand).
- Rotate CTAs day to day; never the same CTA two days in a row (assume
  yesterday used the previous CTA in the brand file's rotation order).
- Don't mention Hardo in the body more than once. Sun is the only day a
  product-forward line is welcome.

## Output format (what to deliver)

1. **3 hook options** (2 lines max each).
2. **Full post body**, ready to paste into LinkedIn (with the chosen hook — pick
   the strongest as default).
3. **Hashtags** (3-5, niche).
4. **First-comment text** (CTA + `[Hardo link]` placeholder + UTM suggestion
   like `?utm_source=linkedin&utm_medium=organic&utm_campaign=daily-rep`).
5. One line: **why this works** (pillar + hook logic).

## Archive (optional, when working in the repo)

When asked to archive, save the final post to
`docs/marketing/linkedin/daily-rep/YYYY-MM-DD-rep-NNN.md` with frontmatter
(`rep`, `date`, `category`, `topic`) so past topics are greppable.
