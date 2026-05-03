import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/knowledge/queries';

const SITE = 'https://hardo-app.bykoleksii.workers.dev';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE + '/', lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: SITE + '/upgrade', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: SITE + '/knowledge', lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: SITE + '/legal/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: SITE + '/legal/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: SITE + '/login', lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: SITE + '/signup', lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const articles = await getPublishedArticles({ limit: 200 });
    articleUrls = articles.map((a) => ({
      url: SITE + '/knowledge/' + a.slug,
      lastModified: a.published_at ? new Date(a.published_at).toISOString() : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    articleUrls = [];
  }

  return [...staticUrls, ...articleUrls];
}
