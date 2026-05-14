import { getSupabaseServer } from '@/lib/supabase/server';

export const ARTICLE_CATEGORIES = ['HARDO News', 'Industry Insights', 'Knowledge Hub'] as const;
export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

export function isArticleCategory(v: unknown): v is ArticleCategory {
  return typeof v === 'string' && (ARTICLE_CATEGORIES as readonly string[]).includes(v);
}

export type KnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body_md: string;
  cover_url: string | null;
  tags: string[];
  category: ArticleCategory;
  status: 'draft' | 'published';
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

export async function getArticleBySlug(slug: string): Promise<KnowledgeArticle | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error || !data) return null;
  return data as KnowledgeArticle;
}
