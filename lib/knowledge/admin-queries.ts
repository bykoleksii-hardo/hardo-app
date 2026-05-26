import { getSupabaseServer } from '@/lib/supabase/server';
import { ARTICLE_CATEGORIES, isArticleCategory, type ArticleCategory } from './categories';
import type { KnowledgeArticle } from './queries';

export async function listAllArticles(): Promise<KnowledgeArticle[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data as KnowledgeArticle[];
}

export async function getArticleById(id: string): Promise<KnowledgeArticle | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as KnowledgeArticle;
}

export type ArticleInput = {
  title: string;
  slug: string;
  description: string | null;
  body_md: string;
  cover_url: string | null;
  tags: string[];
  category: ArticleCategory;
  status: 'draft' | 'scheduled' | 'published';
  published_at?: string | null;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function normalizeInput(raw: ArticleInput): ArticleInput {
  return {
    ...raw,
    slug: raw.slug ? slugify(raw.slug) : slugify(raw.title),
    tags: raw.tags.map((t) => t.trim()).filter(Boolean).slice(0, 8),
  };
}

function validate(input: ArticleInput): string | null {
  if (!input.title.trim()) return 'Title is required';
  if (!input.body_md.trim()) return 'Body is required';
  if (!isArticleCategory(input.category)) {
    return `Category must be one of: ${ARTICLE_CATEGORIES.join(', ')}`;
  }
  return null;
}

export async function createArticle(input: ArticleInput): Promise<{ id?: string; error?: string }> {
  const v = validate(input);
  if (v) return { error: v };

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Not authenticated' };

  const norm = normalizeInput(input);
  const payload: Record<string, unknown> = {
    title: norm.title,
    slug: norm.slug,
    description: norm.description,
    body_md: norm.body_md,
    cover_url: norm.cover_url,
    tags: norm.tags,
    category: norm.category,
    status: norm.status,
    published_at: norm.published_at ?? null,
    author_id: userData.user.id,
  };
  if (norm.status === 'published') payload.published_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert(payload)
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateArticle(id: string, input: ArticleInput): Promise<{ error?: string }> {
  const v = validate(input);
  if (v) return { error: v };

  const supabase = await getSupabaseServer();
  const norm = normalizeInput(input);

  const existing = await getArticleById(id);
  if (!existing) return { error: 'Not found' };

  const payload: Record<string, unknown> = {
    title: norm.title,
    slug: norm.slug,
    description: norm.description,
    body_md: norm.body_md,
    cover_url: norm.cover_url,
    tags: norm.tags,
    category: norm.category,
    status: norm.status,
    published_at: norm.published_at ?? null,
  };

  if (norm.status === 'published' && existing.status !== 'published') {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('knowledge_articles')
    .update(payload)
    .eq('id', id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteArticle(id: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('knowledge_articles')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };
  return {};
}
