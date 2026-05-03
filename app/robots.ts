import type { MetadataRoute } from 'next';

const SITE = 'https://hardo-app.bykoleksii.workers.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/setup', '/interview/', '/profile'],
      },
    ],
    sitemap: SITE + '/sitemap.xml',
    host: SITE,
  };
}
