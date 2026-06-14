import { listPublishedArticles } from '@/lib/knowledge/queries';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

// /knowledge/feed.xml — RSS 2.0 feed for the Knowledge Hub (linked from the
// hub page via <link rel="alternate" type="application/rss+xml">).
export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let articles: Awaited<ReturnType<typeof listPublishedArticles>> = [];
  try {
    articles = await listPublishedArticles({ limit: 50 });
  } catch {
    articles = [];
  }

  const items = articles
    .map((a) => {
      const link = `${SITE_URL}/knowledge/${a.slug}`;
      const pub = new Date(a.published_at || a.updated_at || Date.now()).toUTCString();
      return [
        '    <item>',
        `      <title>${esc(a.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${pub}</pubDate>`,
        `      <category>${esc(a.category)}</category>`,
        a.description ? `      <description>${esc(a.description)}</description>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — Knowledge Hub</title>
    <link>${SITE_URL}/knowledge</link>
    <atom:link href="${SITE_URL}/knowledge/feed.xml" rel="self" type="application/rss+xml" />
    <description>Tactical breakdowns of the questions that decide an IB offer.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
