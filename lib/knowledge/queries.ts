import { cache } from 'react';
import { getSupabaseServer } from '@/lib/supabase/server';
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
  const supabase = await getSupabaseServer();
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
  const supabase = await getSupabaseServer();
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
  const supabase = await getSupabaseServer();
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
