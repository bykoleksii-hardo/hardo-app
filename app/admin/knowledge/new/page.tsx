import ArticleEditor from '../_components/ArticleEditor';
import { createArticle, type ArticleInput } from '@/lib/knowledge/admin-queries';
import { isArticleCategory, type ArticleCategory } from '@/lib/knowledge/queries';
import { renderMarkdown } from '@/lib/knowledge/markdown';

export const dynamic = 'force-dynamic';

async function saveAction(formData: FormData) {
  'use server';
  const rawCat = String(formData.get('category') ?? 'Knowledge Hub');
  const category: ArticleCategory = isArticleCategory(rawCat) ? rawCat : 'Knowledge Hub';
  const input: ArticleInput = {
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    description: (String(formData.get('description') ?? '') || null),
    body_md: String(formData.get('body_md') ?? ''),
    cover_url: (String(formData.get('cover_url') ?? '') || null),
    tags: String(formData.get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    category,
    status: (String(formData.get('status') ?? 'draft') === 'published' ? 'published' : 'draft'),
  };
  return createArticle(input);
}

async function previewAction(md: string): Promise<string> {
  'use server';
  return renderMarkdown(md);
}

export default function NewArticlePage() {
  return <ArticleEditor saveAction={saveAction} previewAction={previewAction} />;
}
