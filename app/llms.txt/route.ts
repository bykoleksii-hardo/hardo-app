import { listPublishedArticles } from '@/lib/knowledge/queries';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';

// /llms.txt — structured site guide for AI crawlers (Google AI Overviews,
// ChatGPT, Perplexity, Claude). Convention: https://llmstxt.org
export const revalidate = 3600;

export async function GET() {
  let articles: Awaited<ReturnType<typeof listPublishedArticles>> = [];
  try {
    articles = await listPublishedArticles({ limit: 200 });
  } catch {
    articles = [];
  }

  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'HARDO runs realistic investment-banking mock interviews — twelve questions per session across technicals, behavioral, and a case, with a letter-grade scorecard at the end. The Knowledge Hub publishes the reasoning behind the questions interviewers actually ask.',
    '',
    '## Knowledge Hub',
  ];

  for (const a of articles) {
    const desc = (a.description || '').replace(/\s+/g, ' ').trim();
    lines.push(`- [${a.title}](${SITE_URL}/knowledge/${a.slug})${desc ? `: ${desc}` : ''}`);
  }

  lines.push(
    '',
    '## Core pages',
    `- [${SITE_NAME} — AI mock interviews for IB](${SITE_URL}/): product overview and how the scorecard works.`,
    `- [Knowledge Hub](${SITE_URL}/knowledge): all published guides and live deal breakdowns.`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
