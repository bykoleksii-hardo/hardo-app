import { cache } from 'react';
// Public, published-only reads use the cookieless static client so the pages and
// route handlers that call them (articles, hub, sitemap, RSS, llms.txt) stay
// cacheable (ISR) instead of being forced dynamic by cookies().
import { getSupabaseStatic } from '@/lib/supabase/static';
import type { ArticleCategory } from './categories';

export { ARTICLE_CATEGORIES, isArticleCategory } from './categories';
export type { ArticleCategory } from './categories';

export type KnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body_md: string;
  cover_url: string | null;
  tags: string[];
  category: ArticleCategory;
  status: 'draft' | 'scheduled' | 'published';
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

type ListOpts = { limit?: number; category?: ArticleCategory };

export async function listPublishedArticles(opts: ListOpts = {}): Promise<KnowledgeArticle[]> {
  const supabase = getSupabaseStatic();
  let q = supabase
    .from('knowledge_articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.category) q = q.eq('category', opts.category);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as KnowledgeArticle[];
}

// Wrapped in React.cache so generateMetadata() and the page body share a single
// DB round-trip per request (both call this with the same slug).
export const getArticleBySlug = cache(async (slug: string): Promise<KnowledgeArticle | null> => {
  const supabase = getSupabaseStatic();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error || !data) return null;
  return data as KnowledgeArticle;
});

// Related articles for internal linking from an article page. Same-category
// first (topical clustering), then filled with the most recent others so the
// section never renders thin.
export async function listRelatedArticles(opts: {
  excludeSlug: string;
  category?: ArticleCategory;
  limit?: number;
}): Promise<KnowledgeArticle[]> {
  const limit = opts.limit ?? 3;
  const supabase = getSupabaseStatic();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('status', 'published')
    .neq('slug', opts.excludeSlug)
    .order('published_at', { ascending: false })
    .limit(30);
  if (error || !data) return [];
  const all = data as KnowledgeArticle[];
  const sameCat = opts.category ? all.filter((a) => a.category === opts.category) : [];
  const rest = all.filter((a) => !sameCat.includes(a));
  return [...sameCat, ...rest].slice(0, limit);
}

// Slugs of all published articles — drives generateStaticParams so every article
// is prerendered at build and served from cache.
export async function listPublishedSlugs(): Promise<string[]> {
  const supabase = getSupabaseStatic();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('slug')
    .eq('status', 'published')
    .limit(500);
  if (error || !data) return [];
  return (data as { slug: string }[]).map((r) => r.slug);
}
