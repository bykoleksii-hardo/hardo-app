---
name: linkedin-daily-rep
description: >
  Generate the daily LinkedIn post for Hardo App from the three-series weekly
  edutainment system: "Find the Flaw" (Mon/Thu — a candidate answer with
  exactly one planted mistake, readers comment the line number), "The Tape"
  (Tue/Fri/Sun — a fictional interview transcript with the interviewer's dry
  bracketed notes), and "Subtitles" (Wed/Sat — one line of interview-speak,
  decoded). Use for the daily LinkedIn post task, the /li-daily command, or
  when the user asks for "today's post", "post of the day", "find the flaw",
  "the tape", or "subtitles". Always load hardo-brand and linkedin-content
  first. Triggers: daily post, post of the day, li-daily, find the flaw,
  the tape, subtitles.
---

# Hardo App — daily LinkedIn system (three-series week)

One post per day. Three recognizable, numbered series rotate across the week —
each teaches one real thing about IB interviews while entertaining, and each
has a built-in comment mechanic the reader can play in under 30 seconds.
**Always apply `hardo-brand` (voice, guardrails, CTA rotation) and
`linkedin-content` (hooks, feed formatting) first.**

## The week

| Day | Series | Edition |
|-----|--------|---------|
| Mon | **Find the Flaw** | technical puzzle |
| Tue | **The Tape** | technical episode |
| Wed | **Subtitles** | interviewer-speak |
| Thu | **Find the Flaw** | technical puzzle (subtler) |
| Fri | **The Tape** | behavioral/fit episode |
| Sat | **Subtitles** | recruiter/networking-speak |
| Sun | **The Tape** | soft/mindset episode |

## Global mechanics

- **Numbering anchor:** W = full weeks elapsed since Mon **2026-07-06** (that
  week is W=0). Each series numbers independently, zero-padded to 3 digits:
  Find the Flaw: Mon → #(2W+1), Thu → #(2W+2). The Tape: Tue → #(3W+1),
  Fri → #(3W+2), Sun → #(3W+3). Subtitles: Wed → #(2W+1), Sat → #(2W+2).
- **Topic cycles:** each series has a 4-week grid (Week A = week of 2026-07-06,
  then B, C, D, then back to A). On repeat cycles the bucket repeats but the
  specific instance must be new — grep the archive first.
- **Language:** English. **Length:** 120-220 words, short scannable lines.
- **Link only in the first comment**, with
  `?utm_source=linkedin&utm_medium=organic&utm_campaign=<series-slug>` — each
  series tracks under its own campaign. End the post body with
  "(link in comments)" so the link is discoverable.
- **Product-forward limits govern the post body only** — the first comment
  always carries the rotating product CTA and the link, on every series.
- **CTA rotation is global across series:** never the same CTA as yesterday's
  post, whichever series it was (rotation ladder in `hardo-brand`).
- **Archive:** save published posts to
  `docs/marketing/linkedin/<series-slug>/YYYY-MM-DD-<series-slug>-NNN.md`
  (slugs: `find-the-flaw`, `the-tape`, `subtitles`) with the frontmatter shown
  in each series section — the archive is the anti-repeat ledger.

## Global hard rules

- Technical accuracy is non-negotiable — one wrong finance statement destroys
  the brand. When in doubt, simplify the scenario rather than risk the claim.
- No fabricated stats, quotes, testimonials, or outcomes; no job guarantees.
- All dialogue and candidates are fictional and labeled as such; never name
  real firms, schools, or people; never frame a drill as a true story.
- Entertainment never buries the lesson: every post must leave the reader with
  one concrete, correct takeaway they could use in a real interview.
- Wit 5/10, professional 8/10 — dry senior-analyst humor; if a line could be
  screenshot-mocked by a skeptical finance student, cut it.

## Output format (what to deliver for any daily post)

1. **2-3 hook options** (2 lines max each; mark the strongest as chosen).
2. **Full post body**, ready to paste into LinkedIn.
3. **Hashtags** (3-5, niche).
4. **First-comment text** (CTA + `[Hardo link]` placeholder + UTM).
5. **Solution comment** (Find the Flaw only — ships pre-written with the post).
6. One line: **why this works** (pillar + hook logic).

---

### Find the Flaw — Mon + Thu (a numbered puzzle: a short candidate answer with exactly one planted mistake; readers comment the line number)

**Skeleton (fill, don't deviate):**

```
[HOOK — 1-2 lines, stakes/curiosity per linkedin-content hook rules. Tease that one
mistake exists; never hint at which line or which concept it touches.]

Find the Flaw #NNN — [topic] edition

The question: "[exact interview question, quoted]"

The candidate's answer:

1. "[claim 1 — one sentence, candidate voice]"
2. "[claim 2]"
3. "[claim 3]"
4. "[claim 4]"
5. "[claim 5 — 4-6 numbered lines total]"

[N−1 spelled out] lines are clean. Exactly one is wrong.

Your move: comment the line number.
Extra credit: say why in one sentence.

Solution goes up in the pinned comment at 5pm ET. Commit before you peek.

[CLOSER — 1-2 lines, dry; light reps bridge OR rotating soft CTA per hardo-brand.
The link never appears here.]

(link in comments)

[3-5 niche hashtags]

--- SOLUTION COMMENT — written WITH the post, posted at 5pm ET, then pinned ---

The flaw: line [X].

[2-4 lines: the categorical rule the line breaks, stated so a banker could not
argue back; include the corrected number/sign/direction where relevant]

Corrected line [X]: "[the clean replacement line]"

[1 line — FILLED IN AT 5pm FROM THE ACTUAL THREAD: collective credit to correct
commenters + pointer to the next episode day. Never pre-write claims about how
the thread went.]
```

**4-week topic grid:**

| Slot | Week A | Week B | Week C | Week D |
|------|--------|--------|--------|--------|
| Mon | DCF mechanics — "Walk me through a DCF" (5-line walkthrough) | EV ↔ equity bridge — "How do you get from enterprise value to equity value?" | LBO value creation — "Where do the returns in an LBO actually come from?" | Accretion/dilution — "All-stock deal: how do you know if it's accretive?" |
| Thu | 3-statement depreciation walk — "Depreciation goes up $10 — walk me through the statements" | WACC inputs — "How would you calculate WACC for this company?" | Trading comps consistency — "You're spreading comps — how do you build the multiple?" | Working capital signs — "NWC increases by $10 — what happens to cash?" |

On repeat cycles (E = A, F = B, …) the bucket repeats but the instance must be new: different question wording AND a different flaw type from the taxonomy below. Grep the archive before writing.

**Flaw taxonomy (pick exactly one per post — the second axis of the instance grid):**

| # | Flaw type | What the planted line looks like |
|---|-----------|----------------------------------|
| 1 | Wrong discount rate for the cash flow type | Unlevered FCF discounted at the cost of equity (or levered FCF at WACC) |
| 2 | Missing tax shield | A $10 pre-tax change hits net income by the full $10 |
| 3 | EV/equity bridge direction error | Net debt ADDED to EV to reach equity value (or cash double-counted — netted inside net debt and then subtracted again separately) |
| 4 | Numerator/denominator multiple mismatch | An enterprise numerator over an equity metric (EV/Net Income) or the reverse (P/EBITDA) |
| 5 | Sign error on NWC | An increase in net working capital shown as a source of cash |
| 6 | Levered/unlevered confusion | A comp's levered beta used directly — without unlevering and re-levering to the target's capital structure — or levered FCF labeled "unlevered" |
| 7 | Double-counting | Cash netted in the bridge AND left in the projected cash flows; synergies counted in both standalone and pro-forma numbers |
| 8 | Book-vs-market inputs | WACC weights built on book value of equity |
| 9 | Impossible terminal growth | Terminal growth rate at or above the discount rate (or above long-run GDP, forever) |
| 10 | Circular terminal value logic | The exit multiple chosen to hit the value the DCF was supposed to test |
| 11 | Accretion/dilution direction flip | All-stock deal where the acquirer's P/E exceeds the deal-price P/E (offer price, premium included) and the candidate calls it dilutive |
| 12 | Debt-paydown-creates-value fallacy | Debt paydown claimed to increase enterprise value (paydown shifts value from debt claims to equity claims; EV is unchanged) |

**Format rules:**

- Valid instance = one question from the day's grid cell × one flaw type from the taxonomy. Log both in archive frontmatter (`flaw_type`, `flaw_line`); never reuse a question × flaw pairing.
- The flaw must be unambiguously wrong — a categorical rule violation (wrong rate, wrong sign, wrong direction) that no banker could defend. Debatable calls (projection length, multiple choice, rounding, phrasing) are never the flaw.
- The answer is 4-6 numbered lines, one claim per line, quoted candidate voice. The candidate reads competent — a strong answer with one real slip, never a strawman.
- Clean lines may use standard interview shorthand ("subtract net debt") — canonical simplifications are defensible. The flawed line never hides behind a hedge or qualifier.
- Difficulty ladder: Mon flaws catchable by anyone mid-prep; Thu flaws may demand real fluency (subtler taxonomy rows). Both must still be categorical, never obscure.
- Fixed vs variable: hook, question, answer lines, flaw, closer, and CTA vary per episode; the series tag format, the "Exactly one is wrong." rule line, the two-line play prompt, and the 5pm ET pinned-solution mechanic are verbatim-fixed.
- The answer is a constructed drill, not a claimed transcript — never frame it as something a real candidate said ("a candidate last week told me…" is banned); any narrative frame must be labeled fictional.
- Wit lives in the hook and closer only (dry, 5/10); the numbered lines and the solution are played completely straight.
- Numbering: Mon → #(2W+1), Thu → #(2W+2), where W = full weeks since Mon 2026-07-06; zero-pad to 3 digits.

**Verification protocol (mandatory before shipping a post):**

- **Correct-first build.** Write the fully clean N-line answer and check every line against the canonical textbook formulation. Only then swap ONE line for the planted flaw. Never draft "an answer with a mistake" from scratch.
- **Flaw unambiguity test.** State, in one sentence, the rule the flawed line breaks. If that sentence needs "usually", "typically", or "it depends", the flaw is debatable — pick a different taxonomy row.
- **Line-by-line defense pass** on the final text: for every clean line, write the one-sentence defense a banker would give. Any line you can't defend unconditionally gets rewritten. This pass exists to catch the fatal failure mode — an accidental second flaw introduced while simplifying.
- **Solution round-trip.** Substituting the solution comment's corrected line back into the answer must yield a fully clean answer; the solution's line number and flaw type must match the archive frontmatter.
- **Repeat check.** Grep the archive for this question × flaw-type combo; if it exists, change one axis before shipping.

**Engagement & CTA:**

- The game IS the comment: a line number is a one-character entry (well under 30 seconds); "extra credit: say why in one sentence" upgrades cheap comments into substantive threads. Before 5pm ET, reply to guesses without confirming or denying ("committed."); if a commenter surfaces a legitimate ambiguity, concede gracefully — senior-analyst humility beats defensiveness.
- First comment (posted immediately, holds the only link): one line of series orientation for new readers + rotating CTA + `[Hardo link]` with `utm_campaign=find-the-flaw`. The first comment never contains the solution or any hint.
- The solution comment ships pre-written with the post, goes up at 5pm ET, and gets pinned. It names the line, the rule broken, and the corrected line, and credits correct commenters collectively — never a scoreboard of who got it wrong.
- Rotate CTAs per hardo-brand; never repeat the previous episode's CTA. The direct CTA maps naturally here: the interviewer's follow-up is where the question gets hard — run it live on Hardo.

---

### The Tape — Tue + Fri + Sun (a fictional interview transcript with the interviewer's private notes interleaved — the reader watches one answer die, then rewrites the fatal line)

**Skeleton (fill, don't deviate):**

```
[HOOK — 1-2 lines: the exact moment it turned. Curiosity/stakes per
linkedin-content hook rules; never spoil the mistake in the hook.]

THE TAPE #NNN — fictional candidate, real mistake.

[SETTING — 1 short line: round + medium + moment. "First round. Phone. Minute six."]

Interviewer: "[question or follow-up]"
Candidate: "[competent answer line — carries the one fatal error]"
[notes: <clipped, dry, ≤10 words, lower-case>]
Candidate: "[continuation — the error propagates]"
[notes: <...>]
Interviewer: "[the lifeline follow-up]"
Candidate: "[the miss]"
[notes: <the quiet verdict>]
Interviewer: "[optional quiet-death beat — moves on without acknowledging]"
(6-10 transcript lines total; 2-4 bracketed notes; Sun episodes may relabel
speakers: Me / Also me / Friend / Mentor)

Where it died: [1 line — name the failure mode plainly. Sun save-episodes
retitle this beat "Where it turned:"]

What the tape should have said:
[2-4 lines — the rigorous model answer. State every assumption explicitly
(the tax rate, the formula, the order). This block is the save magnet.]

Your rep: rewrite the candidate's [fatal] line. Comments are open.

(link in comments)

[3-5 niche hashtags — the link itself goes in the first comment, never here]
```

**4-week topic grid:**

| Slot | Week A | Week B | Week C | Week D |
|------|--------|--------|--------|--------|
| **Tue** (technical) | Depreciation +$10 through the 3 statements × The Missing Tax Rate (first-round phone) | "Walk me through a DCF" × The Recitation — dies on "why do you discount at WACC?" (superday) | Enterprise vs equity value × The Double-Down — "can equity value be negative?" (Zoom screen) | "Walk me through an LBO" × The Zero-Numbers Answer — value-creation levers with no numbers (superday) |
| **Fri** (behavioral/fit) | "Why investment banking?" × The Generic Why — the answer fits any industry (first round) | "Tell me about yourself" × The Ramble — three minutes, no arc (coffee chat that turned into a screen) | "What's your greatest weakness?" × The Fake Weakness — "I'm a perfectionist" (superday) | "Do you have any questions for us?" × The Flattery Reflex — the closer wasted on a compliment (final round) |
| **Sun** (soft/mindset) | Night before the superday — internal monologue, cramming at 11pm; lesson: the taper protocol | Post-rejection debrief — chat with a mentor after the "other candidates" email; lesson: extract the one fixable thing | The freeze — candidate blanks mid-answer and recovers (The Recovery Tape; ends in a save) | Text thread with a friend who just got the offer — the comparison spiral; lesson: process over scoreboard |

**Failure-mode library (pick exactly one per episode; combine question × failure mode × round setting):**

1. **The Missing Tax Rate** — omits taxes in a flow-through; every number after is off by the tax shield.
2. **The Recitation** — memorized answer delivered cleanly, collapses on the first "why?" follow-up.
3. **The Generic Why** — a "why banking / why us" answer that fits any firm or any industry.
4. **The Ramble** — no structure; the answer passes its correct ending and keeps going.
5. **The Double-Down** — defends a wrong number when the follow-up was a lifeline, not an attack.
6. **The Flattery Reflex** — answers a fit question by complimenting the firm instead of revealing substance.
7. **The Fake Weakness** — a strength dressed as a weakness; interviewer has heard it 40 times.
8. **The Zero-Numbers Answer** — qualitative-only reply to a quantitative question ("it depends on assumptions").
9. **The Sign Flip** — right mechanics, wrong direction (adds where it should subtract, accretive vs dilutive).
10. **The Wrong Altitude** — big-picture question answered with minutiae, or a mechanics question answered with vibes.
11. **The False Precision** — invents decimal-point figures for confidence, can't source them when probed.
12. **The Freeze** — blanks mid-answer; reserved mainly for Sun recovery episodes, where the save is the lesson.

**Format rules:**

- **Numbering:** Tue → #(3W+1), Fri → #(3W+2), Sun → #(3W+3), where W = full weeks since Mon 2026-07-06 (so the week of 2026-07-06 produces #001/#002/#003). Zero-pad to 3 digits.
- **The series line is non-negotiable and verbatim in every post**, immediately after the hook: `THE TAPE #NNN — fictional candidate, real mistake.` It is the fiction disclosure — never reworded, never dropped.
- **The bracketed [notes: ...] are the signature voice:** clipped, dry, ≤10 words, lower-case, clinical. The comedy is dramatic irony — the reader sees the evaluation before the candidate does. Never cruel, never about the person ("no tax rate. waiting." — yes; anything sneering — rewrite). 2-4 notes per episode, never after every line.
- **The candidate is competent-but-for-one-error and sympathetic.** Exactly one fatal mistake per episode, taken from the failure-mode library; every other transcript line must be individually defensible under hostile reading.
- **Episode types by day:** Tue = technical, Fri = behavioral/fit, Sun = soft/mindset. Sun transcripts may be an internal monologue or a chat with a friend/mentor (relabel speakers); the lesson block stays mandatory, and Sun may end in a save — retitle the beat "Where it turned:". The Recovery Tape (Sun Week C) is the canonical save episode; keep endings unpredictable.
- **On repeat cycles** (Week A/B/C/D buckets recur every 4 weeks) the bucket repeats but the failure mode or the setting must change — the transcript itself is always new.
- **The model-answer block is the save magnet:** 2-4 lines, rigorous, self-contained, assumptions stated explicitly (name the tax rate, the formula, the order). If accuracy is in any doubt, simplify the scenario rather than risk the fix.
- **120-220 words, short lines, link only in first comment;** wit 5/10, professional 8/10 per hardo-brand; Hardo named at most once in the body, product-forward body copy only on Sun (the first comment’s CTA is exempt).
- **Varies daily:** question, failure mode, setting, hook, CTA, speaker labels. **Fixed:** series line, skeleton order, notes voice, the "Where it died/turned:" beat, the "Your rep:" closer, 3-5 niche hashtags.

**Verification protocol (mandatory before shipping a post):**

- Re-derive the model answer from a blank page, without looking at the transcript; the numbers must tie end-to-end (e.g. depreciation +$10 at a 40% tax rate — round-number convention, always state it: NI −$6, CFS +$10 add-back, net cash +$4, balance sheet balances at assets −$6 = retained earnings −$6). If your re-derivation and the fix block differ at all, stop and resolve before posting.
- Read every non-fatal transcript line as a hostile analyst: each must stand alone as defensible, or a commenter finds a second flaw and the format's authority dies. Cut or simplify any ambiguous line.
- Confirm the series line is present verbatim and nothing implies a real person, bank, or event — no real names, no named firms, no "true story" framing.
- Read the bracketed notes aloud in a flat voice: any note that sounds like a sneer at the person rather than a clinical observation of the moment gets rewritten.
- Grep the archive frontmatter for this question × failure-mode combination; if it has run, change the failure mode or the setting.

**Engagement & CTA:**

- The comment mechanic is the fixed closer: "Your rep: rewrite the candidate's [fatal] line. Comments are open." — a public micro-rep, which is the product's behavior in miniature. Reply to the strongest rewrites in the notes voice ("clean. pass.") to reward participation without breaking character.
- First comment carries the only link: one bridging line plus `[Hardo link]?utm_source=linkedin&utm_medium=organic&utm_campaign=the-tape`. Rotate the framing per hardo-brand's CTA ladder; never the same CTA as the previous day's post (any series).
- Occasional variant (at most one episode in six): withhold the model-answer block from the body — "the fix is in the first comment. Rewrite the line before you look." The fix then leads the first comment, above the link.
- Save-bait is built in: the fix block doubles as a flashcard, so the soft "save this for your next prep session" CTA slots naturally on technical Tuesdays.

---

### Subtitles — Wed + Sat (one line of interview-speak, decoded: what they said vs. what you heard vs. what it usually means — resolved into a tactical move)

**Skeleton (fill, don't deviate):**

```
"[the exact line, quoted]"
[1 deadpan line of stakes or context — no exclamation marks]

Subtitles #NNN — [interviewer-speak | recruiter-speak] edition

What they said:
"[the line again, exact]"

What you heard:
"[the anxious candidate's misread — 1 line; this is the joke]"

What it means:
[the charitable decode — 1-2 lines, hedged: "usually", "more often than not"]

[Reality note — 1-2 lines: why this convention exists / what is actually being tested]

[Protocol name, e.g. "Second-pass protocol", "Hold-or-fold protocol"]:
→ [tactical move 1 — imperative, executable in the moment]
→ [tactical move 2]
→ [tactical move 3, max 4]

[Closer — 1-2 lines, contrast reframe: the candidate who hears X vs. the one who hears Y]

Heard a line you couldn't decode? Drop it below — the best one becomes a future subtitle.

[3-5 niche hashtags]
```

**4-week topic grid:**

| Slot | Week A | Week B | Week C | Week D |
|------|--------|--------|--------|--------|
| **Wed — interviewer-speak** | Pressure-test lines: "Are you sure?" | Pacing lines: "Take your time." | Transition lines: "Let's switch gears." | Closing lines: "Do you have any questions for us?" |
| **Sat — recruiter/networking-speak** | Rejection language: "We've decided to move forward with other candidates." | Coffee-chat replies: "Happy to chat!" | Process limbo: "We'll be in touch." | Soft closes: "We'll keep your resume on file." |

Each cell = theme + launch instance. On repeat cycles (A/B/C/D again), keep the cell's theme but pull a **fresh, unused phrase** from the corpus below or the crowdsourced queue — the theme repeats, the phrase never does.

**Format rules:**

- **Numbering:** W = full weeks since Mon 2026-07-06. Wed → #(2W+1), Sat → #(2W+2), zero-padded to 3 digits (Wed 2026-07-08 = #001, Sat 2026-07-11 = #002).
- **One phrase per post,** and it must be a real, *generic* convention — never attributed to a named firm, school, or person. Recruiter emails are paraphrased boilerplate, never real screenshots.
- **Two editions, never mixed:** Wed = interviewer-speak (lines said inside the interview room); Sat = recruiter/networking-speak (emails, coffee chats, rejection language).
- **The decode is charitable and hedged.** Use "usually", "more often than not", "as a convention" — never mind-reading certainty, never interviewer-as-villain. The person who said the line is following process or extending a chance.
- **The humor lives only in the "What you heard" line** — one line, deadpan, targeting the candidate's inner monologue, never a person. Wit 5/10; if it reads as snark at the interviewer, cut it.
- **The payoff is always tactical:** the protocol block is 2-4 arrows, imperative voice, executable in the moment the reader hears the line. The protocol *name* varies per post; the arrow format doesn't.
- **Fixed vs. variable:** the six beats, the labels (What they said / What you heard / What it means), the series-tag format, and the crowdsource line are verbatim-fixed. Phrase, misread, decode, reality note, protocol, and closer change every post.
- **Sat rejection-language posts get extra warmth** — the reader may have received that exact email this week. Reassurance must be grounded in process fact (pipelines, base rates), never toxic positivity, never flippant.
- **120-220 words, short lines.** At most one light Hardo mention in the body (usually zero); the product CTA and link live in the first comment only.

**Verification protocol (mandatory before shipping a post):**

- **Charity read:** re-read the decode as the person who said the line. Would they nod ("fair") or feel accused? If accused, rewrite before shipping.
- **Hedge audit:** the "What it means" beat contains an explicit hedge and claims a convention, not a certainty — zero instances of "always means" / "never means". If the phrase is genuinely ambiguous, the reality note says so outright.
- **Accuracy check:** the decode and protocol must match standard, well-documented interview convention. If you can't ground the decode in the mainstream prep canon, pick a different phrase — never publish a speculative decode.
- **Repeat check:** grep the archive (`docs/marketing/linkedin/subtitles/`) for the phrase and close paraphrases; mark the phrase as used in the corpus below as soon as the post is drafted/scheduled.
- **30-second test:** the said/heard/means payoff fits in the first screen, and a reader can participate (drop their own phrase) with zero preparation.

**Engagement & CTA:**

- **Standing crowdsource loop — mandatory, verbatim, every post:** "Heard a line you couldn't decode? Drop it below — the best one becomes a future subtitle." Submitted phrases go into the corpus queue; credit commenters anonymously ("a reader sent this one in") unless they explicitly opt in to being named.
- **First comment** = rotating product CTA (soft/medium/direct per hardo-brand — never the same phrasing two Subtitles in a row) + `[Hardo link]?utm_source=linkedin&utm_medium=organic&utm_campaign=subtitles`.
- **Work the thread in hour one:** reply to strong submissions, and when one gets scheduled say so publicly ("this one's going in the queue") — visible payoff is what keeps the loop refilling the corpus.
- **Optional variant (max 1 in 4 posts):** withhold "What it means" from the body and post the translation as the first comment ("translation below — commit to a guess first"); when used, the product CTA moves into that same comment.

**Starter phrase corpus (mark used phrases with the post number; grep the archive before writing):**

*Interviewer-speak (Wed):*
- "Are you sure?" — conviction test, not a verdict *(used: #001)*
- "Interesting. Walk me through that one more time." — a slip flag or a consistency test — re-run it carefully; change only what you actually find wrong
- "Take your time." — usually genuine: permission to pause, often a hint you’re rushing — slow down, structure, then answer
- "Let's switch gears." — signal acquired, moving on; don't relitigate
- "Where did that number come from?" — memorized vs. understood
- "Let's try a different one." — sample-size logic, not a verdict; reset clean
- "Do you have any questions for us?" — still being scored; your questions show what you care about
- "Talk me through your thinking." — process over answer
- "We're short on time, so — quickly:" — headline-first test
- "That's one way to look at it." — mild skepticism or an alternatives test; acknowledge the other side, then defend or update
- "Assume you don't have a calculator." — comfort with round numbers and logic
- "Anything you'd like to add?" — an open door for the close, not a trap
- "And if I told you I disagreed?" — composure under pushback
- "Don't worry, this isn't a math test." — permission to think aloud; approach is the score
- "Tell me something that's not on your resume." — prepared spontaneity, self-awareness check

*Recruiter/networking-speak (Sat):*
- "We've decided to move forward with other candidates." — process boilerplate, not a character verdict
- "We'll be in touch." — early silence is usually scheduling, not judgment; follow up once after the stated window, keep recruiting in parallel
- "We'll keep your resume on file." — a courtesy close; act as if it isn't, occasionally it is
- "Your profile is impressive, but…" — the softener convention before a no
- "Happy to chat!" — a real offer, but you carry the scheduling; make it one-click easy or it dies
- "Let me connect you with someone on the team." — a real door; the handoff is the test
- "Feel free to reach out with any questions." — an open channel almost nobody uses
- "We're still finalizing our timeline." — their process isn't set; not a soft no
- "You might be a better fit for [other group]." — a redirect, often a real signal about headcount
- "Let's find time in a few weeks." — deprioritized, not rejected; send the low-friction follow-up
- "How's recruiting going for you?" — part small talk, part traction read; answer confident and specific, never desperate
- "Who else have you spoken with at the firm?" — measuring how seriously you're working the process
- "I'd encourage you to apply online." — the application is mandatory either way; support is signaled by what they add (name-drop, referral, follow-up offer), not by the line itself
- "It was a very competitive pool this year." — a statistic, not feedback
- "I'll pass your resume along." — works when you make it effortless to be true (attach the resume, one-line blurb ready)
