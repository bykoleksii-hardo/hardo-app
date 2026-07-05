# CLAUDE.md

## Marketing content: product facts (verify before publishing)

- **Intern / Analyst / Associate are CANDIDATE levels ("rooms" in product copy)**: the seat the candidate
  interviews for, not interviewer personas. In the DB they live in `candidate_level`; the interviewer
  persona is a separate field (`interviews.interviewer_persona`). Never write "interviewer tiers" in
  content. Product wording: landing FAQ says "Three rooms: Intern, Analyst, and Associate. Each pulls
  from its own question pool and grades against the bar for that level"; the login page says "Pick your room".
- **Verify counts live against the production Supabase DB** (project `otmbwvjmkeescasfiswp`) instead of
  reusing numbers from older docs. As of 2026-07-05: 997 primary questions across 12 categories, plus 122
  `follow_up` templates counted separately (`questions.type`). The `_backup_questions` table is stale, ignore it.
- Marketing copy source of truth: `hardo-linkedin-launch-kit.md` (verified facts in section 2).
  Carousel generators live in `marketing/carousel-*/` (HTML slides + Puppeteer render script; JPEG on
  purpose, PNG bloats the grain texture ~7x).
- Social copy style: no em dashes, no AI-cliché patterns (epigram closers, "Not X. Y." fragments,
  word-echo callbacks). Outbound links go in the first comment, not the post body.
