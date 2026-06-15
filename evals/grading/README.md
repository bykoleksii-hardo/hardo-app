# Grading eval

A small golden set + runner to measure how accurately and consistently the AI
grades a block, and to catch regressions when we touch the prompt, rubric
weights, or model.

It grades each case through the **same** `close_block` prompt, schema and
temperature the product uses (`GRADING_TEMPERATURE`), derives the block letter
from the rubric, and checks it against an expected band.

## Run

```bash
# one pass over every case
OPENAI_API_KEY=sk-... npx tsx evals/grading/run.ts

# 3 passes per case to measure run-to-run consistency, and a stronger model
OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4o npx tsx evals/grading/run.ts --runs 3

# gate threshold (default 0.7) — exits non-zero below it (CI-friendly)
OPENAI_API_KEY=sk-... npx tsx evals/grading/run.ts --min 0.75
```

## Output

Per case: `PASS/FAIL`, the modal letter vs the expected band, the band-distance,
`[N distinct/RUNS]` consistency when `--runs > 1`, and per-axis range checks.
Then a summary: band accuracy, mean band-distance, axis-range accuracy, and the
list of misses.

## Extending the set

Add cases to `dataset.ts`. Keep answers realistic and the expected `band`
defensible (a band, not a single letter — grading has legitimate slack). Use
`axes` to assert a 0–4 range on specific rubric axes when the case is meant to
probe one dimension (e.g. an asserted discount rate -> low `correctness`/`depth`).

This set is the safety net for the bigger accuracy work (answer keys / model
answers): run it before and after to confirm changes help rather than drift.
