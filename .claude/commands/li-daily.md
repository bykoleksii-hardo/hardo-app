---
description: Generate today's LinkedIn post for Hardo App (three-series week — Find the Flaw / The Tape / Subtitles)
argument-hint: "[optional: date YYYY-MM-DD and/or topic override]"
---

Apply the `hardo-brand`, `linkedin-content`, and `linkedin-daily-rep` skills.

Generate the daily LinkedIn post for: **$ARGUMENTS**

- If no date is given, use today's date. The weekday selects the series
  (Mon/Thu → Find the Flaw, Tue/Fri/Sun → The Tape, Wed/Sat → Subtitles);
  compute the series number and the 4-week curriculum slot per the
  `linkedin-daily-rep` skill.
- If a topic is given, it overrides the curriculum slot but keeps the day's
  series shape and numbering.
- Before writing, grep `docs/marketing/linkedin/find-the-flaw/`, `the-tape/`,
  and `subtitles/` — never repeat a used instance (question × flaw type,
  question × failure mode, or phrase).
- Run the series' **verification protocol** from the skill before finalizing —
  technical accuracy is non-negotiable.

Deliver exactly the output format defined in `linkedin-daily-rep`:
2-3 hooks → full post body → hashtags → first-comment text → solution comment
(Find the Flaw only) → why-this-works line.

Rules: technically accurate finance, fiction labeled fictional, no fabricated
stats/quotes, no job guarantees, rotate the CTA vs yesterday, link in first
comment only (`utm_campaign=<series-slug>`).
