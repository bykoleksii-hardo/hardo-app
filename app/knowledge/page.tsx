import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublishedArticles, ARTICLE_CATEGORIES, isArticleCategory, type ArticleCategory, type KnowledgeArticle } from '@/lib/knowledge/queries';
import LandingFooter from '@/app/(landing)/_components/Footer';
import JsonLd from '@/app/_components/JsonLd';
import HeaderAuth from '@/app/_components/HeaderAuth';
import { breadcrumbLd, collectionLd } from '@/lib/seo';

const PAGE_TITLE = 'Investment Banking Interview Guides \u2014 HARDO Knowledge Hub';
const PAGE_DESC = 'Investment banking interview guides \u2014 DCF, LBO, comps, accretion and behavioral. The tactical breakdowns and the rubric behind every question that decides an offer.';

// All category-filtered views (?category=\u2026) canonicalize to the clean /knowledge
// URL so the filtered slices don't compete as duplicate/thin pages.
export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: '/knowledge',
    types: { 'application/rss+xml': '/knowledge/feed.xml' },
  },
  openGraph: { type: 'website', title: PAGE_TITLE, description: PAGE_DESC, url: '/knowledge', images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: PAGE_TITLE, description: PAGE_DESC, images: ['/og.png'] },
};

export const dynamic = 'force-dynamic';

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type SearchParams = { category?: string };

export default async function KnowledgeIndex({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const active: ArticleCategory | null = isArticleCategory(sp?.category) ? (sp.category as ArticleCategory) : null;
  const articles = await listPublishedArticles({ limit: 50, category: active ?? undefined });

  return (
    <>
      <HeaderAuth onLanding />
      <main>
        <section className="border-b border-line">
          <div className="max-w-page mx-auto px-6 pt-20 pb-16">
            <div className="kicker mb-3">Knowledge Hub</div>
            <h1 className="font-serif text-[52px] md:text-[68px] font-light leading-[1.04] tracking-[-0.022em] max-w-3xl">
              Investment banking interview notes from the desk.
            </h1>
            <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
              Tactical breakdowns of the questions that decide an offer. Platform updates, industry context, and the rubric behind every grade.
            </p>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="max-w-page mx-auto px-6 py-5 flex flex-wrap gap-2">
            <CategoryTab href="/knowledge" label="All" active={active === null} />
            {ARTICLE_CATEGORIES.map((c) => (
              <CategoryTab
                key={c}
                href={`/knowledge?category=${encodeURIComponent(c)}`}
                label={c}
                active={active === c}
              />
            ))}
          </div>
        </section>

        <section className="bg-cream/30">
          <div className="max-w-page mx-auto px-6 py-16">
            {articles.length === 0 ? (
              <div className="border border-line rounded-md bg-paper p-12 text-center max-w-2xl mx-auto">
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">
                  {active ? `No articles in \u201C${active}\u201D yet` : 'No articles yet'}
                </div>
                <p className="mt-3 font-serif text-[22px] font-light">First drops landing soon.</p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] text-ink hover:text-gold transition-colors"
                >
                  <span aria-hidden>{'\u2190'}</span> Back to home
                </Link>
              </div>
            ) : (
              <div className="space-y-12 md:space-y-16">
                <FeatureCard a={articles[0]} />
                {articles.length > 1 && (
                  <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                    {articles.slice(1).map((a) => (
                      <li key={a.id} className="h-full">
                        <ArticleCard a={a} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
      <JsonLd
        data={[
          breadcrumbLd([
            { name: 'Home', url: '/' },
            { name: 'Knowledge Hub', url: '/knowledge' },
          ]),
          collectionLd({
            url: '/knowledge',
            name: 'Knowledge Hub',
            description: PAGE_DESC,
            items: articles.map((a) => ({ slug: a.slug, title: a.title })),
          }),
        ]}
      />
    </>
  );
}

function CategoryTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-block text-[12px] font-mono uppercase tracking-widest bg-ink text-paper px-4 py-2 rounded-full'
          : 'inline-block text-[12px] font-mono uppercase tracking-widest text-ink-2 hover:text-ink border border-line hover:border-ink px-4 py-2 rounded-full transition-colors'
      }
    >
      {label}
    </Link>
  );
}

// Featured lead article — the eye-grabber: large cover beside an oversized
// serif headline, with a "Featured" chip and a Read affordance on hover.
function FeatureCard({ a }: { a: KnowledgeArticle }) {
  const tag = a.tags?.[0];
  return (
    <Link
      href={`/knowledge/${a.slug}`}
      className="kn-card group grid md:grid-cols-[1.25fr_1fr] items-center gap-6 md:gap-10 rounded-lg border border-line bg-paper p-4 md:p-6"
    >
      <div className="relative overflow-hidden rounded-md bg-cream aspect-[16/10] md:aspect-[4/3]">
        {a.cover_url ? (
          <img
            src={a.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-mono text-[11px] uppercase tracking-widest text-muted">HARDO</div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center font-mono text-[9.5px] uppercase tracking-widest text-gold-2 bg-paper/90 backdrop-blur px-2.5 py-1 rounded-full border border-line">
          Featured
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-gold-2">{a.category}</span>
          {tag && (
            <>
              <span className="text-muted">{'·'}</span>
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">{tag}</span>
            </>
          )}
        </div>
        <h2 className="mt-3 font-serif text-[28px] md:text-[36px] font-light leading-[1.08] tracking-[-0.012em] group-hover:text-gold transition-colors">
          {a.title}
        </h2>
        {a.description && (
          <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-xl line-clamp-3">{a.description}</p>
        )}
        <div className="mt-5 flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-widest text-muted">
          <span>{fmtDate(a.published_at)}</span>
          <span className="h-px w-6 bg-line" aria-hidden />
          <span className="inline-flex items-center gap-1 text-gold opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            Read the breakdown <span aria-hidden>{'→'}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

// Standard article card — cover on top, then category, title, blurb, date.
// Equal-height in the grid (mt-auto pins the footer); hover lifts the card,
// zooms the cover, and slides in a "Read" cue.
function ArticleCard({ a }: { a: KnowledgeArticle }) {
  const tag = a.tags?.[0];
  return (
    <Link
      href={`/knowledge/${a.slug}`}
      className="kn-card group flex h-full flex-col rounded-lg border border-line bg-paper p-3.5"
    >
      <div className="relative overflow-hidden rounded-md bg-cream aspect-[16/10]">
        {a.cover_url ? (
          <img
            src={a.cover_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-widest text-muted">HARDO</div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pt-4 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold-2">{a.category}</span>
          {tag && (
            <>
              <span className="text-muted text-[10px]">{'·'}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{tag}</span>
            </>
          )}
        </div>
        <h2 className="mt-2.5 font-serif text-[20px] font-medium leading-snug group-hover:text-gold transition-colors line-clamp-2">
          {a.title}
        </h2>
        {a.description && (
          <p className="mt-2.5 text-[13.5px] text-ink-2 leading-relaxed line-clamp-2">{a.description}</p>
        )}
        <div className="mt-auto pt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span>{fmtDate(a.published_at)}</span>
          <span className="inline-flex items-center gap-1 text-gold opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            Read <span aria-hidden>{'→'}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
