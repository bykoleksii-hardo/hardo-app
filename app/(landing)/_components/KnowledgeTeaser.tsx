import Link from 'next/link';
import { listPublishedArticles } from '@/lib/knowledge/queries';

export default async function KnowledgeTeaser() {
  const articles = await listPublishedArticles({ limit: 3 });
  return (
    <section className="py-24 border-t border-[#f5efe2]/10 bg-[#050d1a]/60">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">Knowledge Hub</div>
            <h2 className="font-serif text-4xl md:text-5xl text-[#f5efe2] max-w-2xl">Notes from the desk.</h2>
          </div>
          <Link href="/knowledge" className="hidden sm:inline text-[#d4a04a] hover:text-[#f5efe2] text-sm uppercase tracking-widest">
            {'See all \u2197'}
          </Link>
        </div>
        {articles.length === 0 ? (
          <div className="border border-dashed border-[#f5efe2]/20 rounded-lg p-10 text-center">
            <p className="text-[#f5efe2]/60 max-w-xl mx-auto leading-relaxed">
              Articles are coming soon: platform updates, industry breakdowns, and tactical guides on how to answer the questions that decide an offer.
            </p>
            <Link href="/knowledge" className="inline-block mt-6 text-[#d4a04a] hover:text-[#f5efe2] text-sm uppercase tracking-widest">
              {'Open Knowledge Hub \u2192'}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((a) => (
              <Link key={a.id} href={`/knowledge/${a.slug}`} className="block border border-[#f5efe2]/10 rounded-lg p-6 bg-[#0a1628]/40 hover:border-[#d4a04a]/40 transition">
                {a.published_at && (
                  <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-3">
                    {new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
                <div className="font-serif text-2xl text-[#f5efe2] mb-3">{a.title}</div>
                {a.description && <p className="text-[#f5efe2]/70 text-sm leading-relaxed">{a.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
