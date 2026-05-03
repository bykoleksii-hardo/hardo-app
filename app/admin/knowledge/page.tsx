import Link from 'next/link';
import { listAllArticles } from '@/lib/knowledge/admin-queries';

export const dynamic = 'force-dynamic';

function fmtDate(s: string | null) {
  if (!s) return '\u2014';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function AdminKnowledgeIndex() {
  const articles = await listAllArticles();

  return (
    <div className="max-w-page mx-auto px-6 pt-12 pb-20">
      <div className="flex items-end justify-between gap-6 mb-10">
        <div>
          <div className="kicker mb-2">Admin {'\u00b7'} Knowledge</div>
          <h1 className="font-serif text-[40px] font-light leading-[1.05] tracking-[-0.022em]">
            Articles
          </h1>
          <p className="mt-3 text-ink-2 text-[14.5px]">{articles.length} total {'\u00b7'} drafts and published</p>
        </div>
        <Link
          href="/admin/knowledge/new"
          className="inline-flex items-center gap-1.5 bg-ink text-paper text-[13px] px-5 py-2.5 rounded-full hover:bg-navy transition-colors"
        >
          New article <span aria-hidden>{'\u2192'}</span>
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="border border-line rounded-md p-12 text-center bg-paper">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted">No articles yet</div>
          <p className="mt-3 font-serif text-[22px] font-light">Write the first one.</p>
          <Link
            href="/admin/knowledge/new"
            className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-ink hover:text-gold"
          >
            Start drafting <span aria-hidden>{'\u2192'}</span>
          </Link>
        </div>
      ) : (
        <div className="border border-line rounded-md overflow-hidden bg-paper">
          <table className="w-full text-[14px]">
            <thead className="bg-cream font-mono text-[10.5px] uppercase tracking-widest text-muted">
              <tr>
                <th className="text-left px-5 py-3 font-normal">Title</th>
                <th className="text-left px-5 py-3 font-normal w-32">Status</th>
                <th className="text-left px-5 py-3 font-normal w-40">Updated</th>
                <th className="text-left px-5 py-3 font-normal w-40">Published</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-cream/60">
                  <td className="px-5 py-4">
                    <div className="font-serif text-[16.5px] font-medium leading-snug text-ink">{a.title}</div>
                    <div className="text-[12px] text-muted mt-0.5 font-mono">{a.slug}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={
                      a.status === 'published'
                        ? 'inline-block text-[10.5px] font-mono uppercase tracking-widest text-paper bg-ink px-2 py-0.5 rounded'
                        : 'inline-block text-[10.5px] font-mono uppercase tracking-widest text-muted border border-line px-2 py-0.5 rounded'
                    }>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12.5px] text-ink-2 font-mono">{fmtDate(a.updated_at as unknown as string)}</td>
                  <td className="px-5 py-4 text-[12.5px] text-ink-2 font-mono">{fmtDate(a.published_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/knowledge/${a.id}/edit`} className="text-[13px] text-ink hover:text-gold">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
