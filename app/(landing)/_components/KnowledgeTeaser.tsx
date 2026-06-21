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
            <div className="mt-14 flex flex-col gap-6">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/knowledge/${a.slug}`}
                  className="kn-card group grid grid-cols-1 sm:grid-cols-[260px_1fr] items-center gap-5 sm:gap-7 rounded-lg border border-line bg-paper p-4 sm:p-5"
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
                      <div className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-widest text-muted">
                        HARDO
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[10.5px] uppercase tracking-widest text-gold-2">
                      {a.category}
                    </div>
                    <h3 className="mt-2.5 font-serif text-[22px] md:text-[26px] leading-snug font-light group-hover:text-gold transition-colors">
                      {a.title}
                    </h3>
                    {a.description && (
                      <p className="mt-2.5 text-[14.5px] text-ink-2 leading-relaxed line-clamp-2">
                        {a.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-widest text-muted">
                      <span>{fmtDate(a.published_at)}</span>
                      <span className="h-px w-6 bg-line" aria-hidden />
                      <span className="inline-flex items-center gap-1 text-gold opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                        Read <span aria-hidden>{'→'}</span>
                      </span>
                    </div>
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
