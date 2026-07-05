-- Migration: add "Market Brief" to the knowledge_articles category whitelist
--
-- New Knowledge Hub section for periodic market-context briefs (rates, credit,
-- M&A/IPO windows) aimed at interview prep. The category list is enforced in two
-- places that must stay in sync:
--   - lib/knowledge/categories.ts (ARTICLE_CATEGORIES - drives the /knowledge
--     filter tabs and the admin editor dropdown)
--   - this CHECK constraint
-- Drop-and-recreate keeps the migration safe to re-run.

alter table public.knowledge_articles
  drop constraint if exists knowledge_articles_category_check;

alter table public.knowledge_articles
  add constraint knowledge_articles_category_check
  check (category = any (array['HARDO Insights'::text, 'Live Deal Examples'::text, 'Market Brief'::text, 'Knowledge Hub'::text]));
