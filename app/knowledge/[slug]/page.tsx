import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/lib/knowledge/queries';
import { renderMarkdown, extractHeadings } from '@/lib/knowledge/markdown';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import ArticleProgress from '@/app/_components/ArticleProgress';
import ArticleToc from '@/app/_components/ArticleToc';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

type Params = { slug: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article not found \u2014 HARDO' };
  const title = article.title + ' \u2014 HARDO';
  const description = article.description ?? undefined;
  const url = `/knowledge/${article.slug}`;
  const images = article.cover_url ? [article.cover_url] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      ...(article.published_at ? { publishedTime: article.published_at } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function readingTime(md: string): number {
  const words = (md || '').replace(/[#>*`~\-\[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') notFound();

  const viewer = await getViewerPlan();
  const signedIn = viewer.plan !== 'anon';
  const role = signedIn ? await getUserRole() : 'user';
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';
  const html = renderMarkdown(article.body_md);
  const tag = article.tags?.[0];
  const toc = extractHeadings(article.body_md);
  const hasToc = toc.length >= 3;

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
      <LandingHeader signedIn={signedIn} isAdmin={isAdmin} isPaid={isPaid} onLanding />
      <ArticleProgress />
      <main>
        <div className={hasToc ? 'mx-auto max-w-6xl px-6 pt-16 pb-20 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14' : 'mx-auto max-w-3xl px-6 pt-16 pb-20'}>
          {hasToc && (
            <aside className="hidden lg:block">
              <ArticleToc items={toc} />
            </aside>
          )}
          <article className={hasToc ? 'min-w-0 max-w-3xl mx-auto lg:mx-0' : ''}>
          <div className="mb-10">
            <Link href="/knowledge" className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink">
              <span aria-hidden>{'\u2190'}</span> Knowledge Hub
            </Link>
          </div>

          <div className="anim-rise d1 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-paper bg-gold px-2 py-0.5 rounded">{article.category}</span>
            {tag && (
              <>
                <span className="text-muted">{'\u00b7'}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">{tag}</span>
              </>
            )}
          </div>

          <h1 className="anim-rise d2 mt-3 font-serif text-[40px] md:text-[52px] font-light leading-[1.05] tracking-[-0.022em]">
            {article.title}
          </h1>
          {article.description && (
            <p className="anim-rise d3 mt-5 text-[18px] text-ink-2 leading-relaxed">{article.description}</p>
          )}
          <div className="anim-rise d4 mt-6 font-mono text-[10.5px] uppercase tracking-widest text-muted">
            {fmtDate(article.published_at)}{article.body_md ? ` · ${readingTime(article.body_md)} min read` : ''}
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
          <div className="mt-14 border-t border-line pt-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Reading is reps. Now take the rep.
            </p>
            <Link
              href={viewer.plan === 'anon' ? '/login' : '/interview/setup'}
              className="hero-pulse mt-5 inline-flex items-center gap-2 bg-ink text-paper text-[15px] font-medium px-9 py-4 rounded-full hover:bg-navy transition-colors"
            >
              Drill this in a mock <span aria-hidden>{'\u2192'}</span>
            </Link>
          </div>
          </article>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      </main>
      <LandingFooter />
    </>
  );
}
