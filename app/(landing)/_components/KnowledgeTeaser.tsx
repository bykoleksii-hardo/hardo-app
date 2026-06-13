import Link from 'next/link';
import Reveal from '@/app/_components/Reveal';
import { listPublishedArticles } from '@/lib/knowledge/queries';

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function KnowledgeTeaser() {
  const articles = (await listPublishedArticles()).slice(0, 3);

  return (
    <section id="knowledge" className="border-t border-line bg-cream/40">
      <div className="max-w-page mx-auto px-6 py-20">
        <Reveal>
          <div className="kicker mb-3">Knowledge Hub</div>
          <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-2xl">
            Notes from the desk.
          </h2>
          <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
            Tactical breakdowns of the questions that decide an offer. Platform updates, industry context, and the rubric behind every grade.
          </p>
        </Reveal>

        {articles.length === 0 ? (
          <div className="mt-14 border border-line rounded-md bg-paper p-10 text-center">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Coming soon</div>
            <p className="mt-3 font-serif text-[24px] font-light leading-snug max-w-lg mx-auto">
              The first set of write-ups is in the editor. Check back shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/knowledge/${a.slug}`}
                  className="kn-card group block border-t border-line pt-5"
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold-2">
                    {a.category}
                  </div>
                  <h3 className="mt-3 font-serif text-[22px] leading-snug font-medium group-hover:text-gold transition-colors">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="mt-3 text-[14px] text-ink-2 leading-relaxed line-clamp-3">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-4 font-mono text-[10.5px] uppercase tracking-widest text-muted">
                    {fmtDate(a.published_at)}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12">
              <Link
                href="/knowledge"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink hover:text-ink/70"
              >
                Browse the Knowledge Hub
                <span aria-hidden>{'\u2192'}</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
