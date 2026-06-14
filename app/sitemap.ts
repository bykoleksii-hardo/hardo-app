import type { MetadataRoute } from 'next';
import { listPublishedArticles } from '@/lib/knowledge/queries';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  let articles: Awaited<ReturnType<typeof listPublishedArticles>> = [];
  try {
    articles = await listPublishedArticles({ limit: 200 });
  } catch {
    articles = [];
  }

  // Freshest article timestamp drives the lastModified of the hub + home pages,
  // so we send an honest signal instead of "everything changed this hour".
  const latest =
    articles.reduce<string | null>((max, a) => {
      const t = a.updated_at || a.published_at;
      return t && (!max || t > max) ? t : max;
    }, null) ?? now;

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: latest, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/ai-investment-banking-mock-interview`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/knowledge`, lastModified: latest, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/knowledge/${a.slug}`,
    lastModified: new Date(a.updated_at || a.published_at || now).toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...articleUrls];
}
