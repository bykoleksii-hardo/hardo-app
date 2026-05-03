import Link from 'next/link';
import type { Metadata } from 'next';
import { listPublishedArticles } from '@/lib/knowledge/queries';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { getViewerPlan } from '@/lib/quota/server';

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

export default async function KnowledgeIndex() {
  const articles = await listPublishedArticles({ limit: 50 });
  const viewer = await getViewerPlan();

  return (
    <>
      <LandingHeader signedIn={viewer.plan !== 'anon'} />
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

        <section>
          <div className="max-w-page mx-auto px-6 py-16">
            {articles.length === 0 ? (
              <div className="border border-line rounded-md bg-paper p-12 text-center max-w-2xl mx-auto">
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Coming soon</div>
                <p className="mt-3 font-serif text-[24px] font-light leading-snug">
                  The first batch of write-ups is in the editor. Check back shortly.
                </p>
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
                      {tag && (
                        <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">{tag}</div>
                      )}
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
