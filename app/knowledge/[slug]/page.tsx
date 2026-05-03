import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { getArticleBySlug } from '@/lib/knowledge/queries';
import { renderMarkdown } from '@/lib/knowledge/markdown';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return { title: 'Article not found {\u2014} HARDO' };
  return {
    title: `${a.title} {\u2014} HARDO Knowledge Hub`,
    description: a.description ?? undefined,
    openGraph: {
      title: a.title,
      description: a.description ?? undefined,
      type: 'article',
      publishedTime: a.published_at ?? undefined,
    },
  };
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const html = renderMarkdown(article.body_md ?? '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description ?? undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    author: { '@type': 'Organization', name: 'HARDO' },
  };

  return (
    <>
      <LandingHeader />
      <main>
        <article className="max-w-3xl mx-auto px-6 py-16">
          <Link href="/knowledge" className="text-[#d4a04a] hover:text-[#f5efe2] text-sm uppercase tracking-widest">
            {'\u2190 Knowledge Hub'}
          </Link>
          {article.published_at && (
            <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mt-8 mb-3">
              {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          <h1 className="font-serif text-5xl md:text-6xl text-[#f5efe2] mb-6 leading-tight">{article.title}</h1>
          {article.description && <p className="text-[#f5efe2]/70 text-lg leading-relaxed mb-12">{article.description}</p>}
          <div className="max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
      <LandingFooter />
    </>
  );
}
