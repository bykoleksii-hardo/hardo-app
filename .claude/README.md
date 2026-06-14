# Hardo Marketing Suite

One unified Claude **Cowork / Claude Code plugin** that turns Claude into a full
marketing team for **Hardo App** (the AI-powered investment-banking mock interview
platform). A single shared brand core powers a **GTM strategist** plus **LinkedIn**
and **X/Twitter** execution studios.

## What's inside (10 skills · 17 commands · 9 agents)

```
hardo-marketing-suite/
├── .claude-plugin/  (plugin.json, marketplace.json)
├── skills/
│   ├── hardo-brand/         # 🎯 shared brand, audience & voice (load-first)
│   ├── gtm-strategist/      # ICP, positioning, pricing, channels, funnel, launch, metrics
│   ├── linkedin-content/ · linkedin-strategy/ · linkedin-growth/ · linkedin-analytics/
│   └── twitter-content/  · twitter-strategy/  · twitter-growth/  · twitter-analytics/
├── commands/
│   ├── gtm-plan · gtm-icp · gtm-pricing · gtm-funnel · gtm-launch
│   ├── li-post · li-carousel · li-calendar · li-growth · li-competitor · li-report
│   └── tw-tweet · tw-thread · tw-calendar · tw-growth · tw-competitor · tw-report
└── agents/
    ├── gtm-strategist
    ├── li-content-writer · li-strategist · li-growth · li-analyst
    └── tw-content-writer · tw-strategist · tw-growth · tw-analyst
```

**`hardo-brand` is the single source of truth** — edit it once and the GTM, LinkedIn,
and X layers all stay in sync.

## How the layers work together

`gtm-strategist` sets the **strategy** (who to win, positioning, pricing, channels,
funnel, launch). The `linkedin-*` and `twitter-*` skills **execute** the channel
strategy (content, growth, analytics). They share the same brand and personas, so
strategy and content never drift.

Typical flow:
1. `/gtm-plan summer-analyst recruiting season` → the strategy.
2. `/gtm-icp`, `/gtm-pricing`, `/gtm-funnel`, `/gtm-launch` → deepen each piece.
3. `/li-calendar 4 weeks` + `/tw-calendar 1 week` → turn strategy into a content plan.
4. `/li-post …`, `/tw-thread …` → produce the actual posts.
5. `/li-report`, `/tw-report` → measure and iterate.

Or just ask in plain language — Claude auto-loads the right skill.

## Install

### Option A — Claude Code (project)
Upload into your repo so sessions auto-discover them:
- `skills/*` → `.claude/skills/`
- `commands/*` → `.claude/commands/`
- `agents/*` → `.claude/agents/`
Start a new session on the repo; everything loads automatically.

### Option B — Cowork / plugin marketplace
Import this folder as a plugin via the Cowork plugin UI (or `/plugin marketplace add`
→ install `hardo-marketing-suite`).

> Replaces the standalone `hardo-social` and `hardo-twitter` plugins — this suite
> contains both plus the GTM strategist, with a single shared `hardo-brand`.

## Guardrails baked in

No job/offer guarantees · no fabricated stats, quotes, market sizes, or willingness-
to-pay · technically accurate finance only · platform-correct link placement · CTAs
rotated · ~80% value / 20% product · strategy decisions lead with a recommendation +
assumptions, not a survey.

MIT licensed. Built for Hardo App.
