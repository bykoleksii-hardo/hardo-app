// Pure constants/types — safe to import from client components.
// Do not add any server-only imports (e.g. next/headers, supabase server) here.

export const ARTICLE_CATEGORIES = ['HARDO News', 'Industry Insights', 'Knowledge Hub'] as const;
export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

export function isArticleCategory(v: unknown): v is ArticleCategory {
  return typeof v === 'string' && (ARTICLE_CATEGORIES as readonly string[]).includes(v);
}
