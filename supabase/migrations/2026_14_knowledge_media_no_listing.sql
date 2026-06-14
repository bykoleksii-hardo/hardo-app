-- 2026_14_knowledge_media_no_listing.sql
-- Advisor 0025 (public_bucket_allows_listing): remove the broad public SELECT
-- policy on storage.objects for the public `knowledge-media` bucket.
--
-- Why this is safe: public object URLs
-- (/storage/v1/object/public/knowledge-media/...) are served because the bucket
-- is marked public, NOT because of this storage.objects SELECT policy. Article
-- cover images are stored as full public URLs (knowledge_articles.cover_url) and
-- rendered via <img src> / OG tags, so they keep working. The only writer is the
-- admin upload route, which uses the service-role client (bypasses RLS), and no
-- code path calls .list() on this bucket. Dropping the policy therefore removes
-- only anonymous listing of every object key.

drop policy if exists "knowledge-media public read" on storage.objects;
