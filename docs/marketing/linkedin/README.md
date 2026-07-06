# Hardo App — daily LinkedIn series archive

The daily system is defined in `.claude/skills/linkedin-daily-rep/SKILL.md`;
generate a post with `/li-daily`. Three numbered series rotate across the week:

| Days | Series | Folder |
|------|--------|--------|
| Mon + Thu | **Find the Flaw** — candidate answer, exactly one planted mistake; readers comment the line number, solution pinned at 5pm ET | `find-the-flaw/` |
| Tue + Fri + Sun | **The Tape** — fictional interview transcript with the interviewer's dry bracketed notes; readers rewrite the fatal line | `the-tape/` |
| Wed + Sat | **Subtitles** — one line of interview-speak decoded (what they said / what you heard / what it means) | `subtitles/` |

- Numbering anchor: week of Mon 2026-07-06 (W=0); each series numbers
  independently — formulas in the skill.
- Automation: a daily Claude Code trigger generates the post each morning;
  copy the body into LinkedIn, post the first comment with the link, and (Find
  the Flaw days) post + pin the solution comment at 5pm ET.
- Save published posts here as `YYYY-MM-DD-<series-slug>-NNN.md` with the
  frontmatter from the skill — this archive is the anti-repeat ledger
  (question × flaw type / failure mode / phrase are grepped before writing).

Superseded: the original single-format «Daily Rep» spec (July 2026) was
replaced by this three-series system before launch.
