import Link from 'next/link';
import type { Metadata } from 'next';
import LandingHeader from '@/app/(landing)/_components/Header';
import LandingFooter from '@/app/(landing)/_components/Footer';
import { listPublishedArticles } from '@/lib/knowledge/queries';

export const metadata: Metadata = {
  title: 'Knowledge Hub \u2014 HARDO',
  description: 'Platform updates, IB industry breakdowns, and tactical guides on how to answer the questions that decide an offer.',
};

export default async function KnowledgeIndex() {
  const articles = await listPublishedArticles({ limit: 50 });
  return (
    <>
      <LandingHeader />
      <main className="min-h-[60vh]">
        <section className="py-20 border-b border-[#f5efe2]/10">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">Knowledge Hub</div>
            <h1 className="font-serif text-5xl md:text-6xl text-[#f5efe2] mb-4">Notes from the desk.</h1>
            <p className="text-[#f5efe2]/70 text-lg max-w-2xl leading-relaxed">
              Platform updates, IB industry breakdowns, and tactical guides on how to answer the questions that decide an offer.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            {articles.length === 0 ? (
              <div className="border border-dashed border-[#f5efe2]/20 rounded-lg p-12 text-center">
                <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">Coming soon</div>
                <p className="text-[#f5efe2]/70 max-w-xl mx-auto leading-relaxed">
                  We{'\u2019'}re drafting the first batch of articles right now. Bookmark this page or come back after your first interview {'\u2014'} we{'\u2019'}ll have something worth reading.
                </p>
                <Link href="/" className="inline-block mt-8 text-[#d4a04a] hover:text-[#f5efe2] text-sm uppercase tracking-widest">
                  {'\u2190 Back to home'}
                </Link>
              </div>
            ) : (
              <ul className="space-y-8">
                {articles.map((a) => (
                  <li key={a.id}>
                    <Link href={`/knowledge/${a.slug}`} className="block group border-b border-[#f5efe2]/10 pb-8 hover:border-[#d4a04a]/40 transition">
                      {a.published_at && (
                        <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-2">
                          {new Date(a.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      <h2 className="font-serif text-3xl text-[#f5efe2] group-hover:text-[#d4a04a] transition mb-2">{a.title}</h2>
                      {a.description && <p className="text-[#f5efe2]/70 leading-relaxed">{a.description}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
