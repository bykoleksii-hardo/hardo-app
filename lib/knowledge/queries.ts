import { getSupabaseServer } from '@/lib/supabase/server';

export type KnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body_md: string;
  cover_url: string | null;
  tags: string[];
  status: 'draft' | 'published';
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function listPublishedArticles(opts: { limit?: number } = {}): Promise<KnowledgeArticle[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(opts.limit ?? 50);
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
