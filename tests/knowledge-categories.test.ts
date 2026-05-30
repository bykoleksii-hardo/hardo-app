import { describe, it, expect } from 'vitest';
import { ARTICLE_CATEGORIES, isArticleCategory } from '@/lib/knowledge/categories';

describe('knowledge categories', () => {
  it('exposes the three known categories', () => {
    expect(ARTICLE_CATEGORIES).toContain('HARDO News');
    expect(ARTICLE_CATEGORIES).toContain('Industry Insights');
    expect(ARTICLE_CATEGORIES).toContain('Knowledge Hub');
  });

  it('isArticleCategory accepts known categories', () => {
    for (const c of ARTICLE_CATEGORIES) {
      expect(isArticleCategory(c)).toBe(true);
    }
  });

  it('isArticleCategory rejects unknown values', () => {
    expect(isArticleCategory('Not A Category')).toBe(false);
    expect(isArticleCategory('')).toBe(false);
    expect(isArticleCategory('hardo news')).toBe(false);
  });
});
