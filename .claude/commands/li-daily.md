---
description: Generate today's «Daily Rep» LinkedIn post for Hardo App (one interview question a day)
argument-hint: "[optional: date YYYY-MM-DD and/or topic override]"
---

Apply the `hardo-brand`, `linkedin-content`, and `linkedin-daily-rep` skills.

Generate the **Daily Rep** LinkedIn post for: **$ARGUMENTS**

- If no date is given, use today's date. Compute the rep number (#NNN, series
  start 2026-07-06 = #001), the weekday category, and the 4-week curriculum
  slot per the `linkedin-daily-rep` skill.
- If a topic is given, it overrides the curriculum slot but keeps the day's
  category shape and numbering.
- Before writing, check `docs/marketing/linkedin/daily-rep/` for past posts and
  do not reuse a specific question that already appeared.

Deliver exactly the output format defined in `linkedin-daily-rep`:
3 hooks → full post body → hashtags → first-comment text → why-this-works line.

Rules: technically accurate finance, no fabricated stats/quotes, no job
guarantees, rotate the CTA, link in first comment only.
