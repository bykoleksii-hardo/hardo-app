import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublishedArticles, ARTICLE_CATEGORIES, isArticleCategory, type ArticleCategory } from '@/lib/knowledge/queries';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Knowledge Hub \u2014 HARDO',
  description: 'Tactical breakdowns of the questions that decide an offer. Platform updates, IB industry context, and the rubric behind every grade.',
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
  const viewer = await getViewerPlan();
  const signedIn = viewer.plan !== 'anon';
  const role = signedIn ? await getUserRole() : 'user';
  const isAdmin = role === 'admin' || role === 'editor';
  const isPaid = viewer.plan === 'paid';

  return (
    <>
      <LandingHeader signedIn={signedIn} isAdmin={isAdmin} isPaid={isPaid} />
      <main>
        <section className="border-b border-line">
          <div className="max-w-page mx-auto px-6 pt-20 pb-16">
            <div className="kicker mb-3">Knowledge Hub</div>
            <h1 className="font-serif text-[52px] md:text-[68px] font-light leading-[1.04] tracking-[-0.022em] max-w-3xl">
              Notes from the desk.
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

        <section>
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
              <ul className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((a) => {
                  const tag = a.tags?.[0];
                  return (
                    <li key={a.id} className="border-t border-line pt-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest text-[#d4a04a]">{a.category}</span>
                        {tag && (
                          <>
                            <span className="text-muted">{'\u00b7'}</span>
                            <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">{tag}</span>
                          </>
                        )}
                      </div>
                      <Link href={`/knowledge/${a.slug}`} className="group block mt-3">
                        <h2 className="font-serif text-[22px] font-medium leading-snug group-hover:text-gold transition-colors">
                          {a.title}
                        </h2>
                        {a.description && (
                          <p className="mt-3 text-[14px] text-ink-2 leading-relaxed">{a.description}</p>
                        )}
                      </Link>
                      <div className="mt-4 font-mono text-[10.5px] uppercase tracking-widest text-muted">
                        {fmtDate(a.published_at)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
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
