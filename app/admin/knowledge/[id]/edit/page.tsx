import { notFound } from 'next/navigation';
import ArticleEditor from '../../_components/ArticleEditor';
import { getArticleById, updateArticle, deleteArticle, type ArticleInput } from '@/lib/knowledge/admin-queries';
import { renderMarkdown } from '@/lib/knowledge/markdown';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export default async function EditArticlePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  async function saveAction(formData: FormData) {
    'use server';
    const aid = String(formData.get('id') ?? '');
    const input: ArticleInput = {
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      description: (String(formData.get('description') ?? '') || null),
      body_md: String(formData.get('body_md') ?? ''),
      cover_url: (String(formData.get('cover_url') ?? '') || null),
      tags: String(formData.get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      status: (String(formData.get('status') ?? 'draft') === 'published' ? 'published' : 'draft'),
    };
    const r = await updateArticle(aid, input);
    return { id: aid, ...r };
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const aid = String(formData.get('id') ?? '');
    return deleteArticle(aid);
  }

  async function previewAction(md: string): Promise<string> {
    'use server';
    return renderMarkdown(md);
  }

  return (
    <ArticleEditor
      initial={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        description: article.description,
        body_md: article.body_md,
        cover_url: article.cover_url,
        tags: article.tags ?? [],
        status: article.status,
      }}
      saveAction={saveAction}
      deleteAction={deleteAction}
      previewAction={previewAction}
    />
  );
}
