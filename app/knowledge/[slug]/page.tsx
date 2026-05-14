import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/lib/knowledge/queries';
import { renderMarkdown } from '@/lib/knowledge/markdown';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { getViewerPlan } from '@/lib/quota/server';

export const dynamic = 'force-dynamic';

type Params = { slug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article not found \u2014 HARDO' };
  return {
    title: article.title + ' \u2014 HARDO',
    description: article.description ?? undefined,
  };
}

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') notFound();

  const viewer = await getViewerPlan();
  const html = renderMarkdown(article.body_md);
  const tag = article.tags?.[0];

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.published_at,
    articleSection: article.category,
    author: { '@type': 'Organization', name: 'HARDO' },
  };

  return (
    <>
      <LandingHeader signedIn={viewer.plan !== 'anon'} />
      <main>
        <article className="max-w-3xl mx-auto px-6 pt-16 pb-20">
          <div className="mb-10">
            <Link href="/knowledge" className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink">
              <span aria-hidden>{'\u2190'}</span> Knowledge Hub
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-paper bg-[#d4a04a] px-2 py-0.5 rounded">{article.category}</span>
            {tag && (
              <>
                <span className="text-muted">{'\u00b7'}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">{tag}</span>
              </>
            )}
          </div>

          <h1 className="mt-3 font-serif text-[40px] md:text-[52px] font-light leading-[1.05] tracking-[-0.022em]">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-5 text-[18px] text-ink-2 leading-relaxed">{article.description}</p>
          )}
          <div className="mt-6 font-mono text-[10.5px] uppercase tracking-widest text-muted">
            {fmtDate(article.published_at)}
          </div>

          {article.cover_url && (
            <img
              src={article.cover_url}
              alt=""
              className="mt-10 w-full rounded border border-line"
              loading="lazy"
            />
          )}

          <div
            className="prose-hardo mt-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      </main>
      <LandingFooter />
    </>
  );
}
