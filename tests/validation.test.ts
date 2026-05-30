import { describe, it, expect } from 'vitest';
import { LIMITS, tooLong, clampString } from '@/lib/validation';

describe('validation helpers', () => {
  it('LIMITS exposes the expected caps', () => {
    expect(LIMITS.ANSWER).toBe(8000);
    expect(LIMITS.SHORT_TEXT).toBe(200);
    expect(LIMITS.MEDIUM_TEXT).toBe(2000);
  });

  it('tooLong is false for strings within the limit', () => {
    expect(tooLong('hello', 10)).toBe(false);
    expect(tooLong('exactly-ten', 'exactly-ten'.length)).toBe(false);
  });

  it('tooLong is true for strings over the limit', () => {
    expect(tooLong('abcdef', 3)).toBe(true);
  });

  it('clampString keeps short strings unchanged', () => {
    expect(clampString('short', 100)).toBe('short');
  });

  it('clampString truncates to the max length', () => {
    const out = clampString('abcdefghij', 4);
    expect(out.length).toBeLessThanOrEqual(4);
  });
});
