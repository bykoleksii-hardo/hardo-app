// Pure SEO constants and Schema.org JSON-LD builders.
// No server-only imports — safe to import from client components, server
// components, and route handlers (mirrors lib/knowledge/categories.ts).

export const SITE_URL = 'https://hardo.app';
export const SITE_NAME = 'HARDO';
export const SITE_DESCRIPTION =
  'AI mock interview simulation for investment banking. Accounting, valuation, M&A, behavioral — all graded with a real scorecard.';
export const ORG_LOGO = `${SITE_URL}/apple-touch-icon.png`;
export const DEFAULT_OG = `${SITE_URL}/og.png`;
export const CONTACT_EMAIL = 'hello@hardo.app';

/** Official external social profiles, used for the footer icon row and the
 * Organization schema's `sameAs` (tells search engines these are the same entity). */
export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/133963955/',
} as const;

/** Resolve a path or absolute URL to a fully-qualified canonical URL. */
export function abs(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE_URL + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

type Json = Record<string, unknown>;

/** Stable @id for the publishing organization, referenced across the graph. */
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: ORG_LOGO },
    image: DEFAULT_OG,
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    sameAs: Object.values(SOCIAL_LINKS),
  };
}

export function websiteLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };
}

export type Crumb = { name: string; url: string };

export function breadcrumbLd(items: Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}

export type ArticleLdInput = {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string;
  published_at: string | null;
  updated_at: string | null;
  wordCount?: number;
};

export function articleLd(a: ArticleLdInput): Json {
  const url = abs(`/knowledge/${a.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: a.title,
    ...(a.description ? { description: a.description } : {}),
    image: [a.cover_url || DEFAULT_OG],
    ...(a.published_at ? { datePublished: a.published_at } : {}),
    dateModified: a.updated_at || a.published_at || undefined,
    articleSection: a.category,
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@id': ORG_ID },
  };
}

export type FaqItem = { q: string; a: string };

export function faqLd(items: FaqItem[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function collectionLd(args: {
  url: string;
  name: string;
  description: string;
  items: { slug: string; title: string }[];
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${abs(args.url)}#collection`,
    url: abs(args.url),
    name: args.name,
    description: args.description,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: args.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(`/knowledge/${it.slug}`),
        name: it.title,
      })),
    },
  };
}
