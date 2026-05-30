import { describe, it, expect } from 'vitest';
import { getTimeLimitSeconds } from '@/lib/timer-config';

describe('getTimeLimitSeconds', () => {
  it('voice mode: regular (non-follow-up) question gets 60s', () => {
    expect(
      getTimeLimitSeconds({ category: 'technical', isFollowUp: false, inputMode: 'voice' }),
    ).toBe(60);
  });

  it('voice mode: case study base gets 120s', () => {
    expect(
      getTimeLimitSeconds({ category: 'case study', isFollowUp: false, inputMode: 'voice' }),
    ).toBe(120);
  });

  it('voice mode: follow-ups are always 60s, even on case study', () => {
    expect(
      getTimeLimitSeconds({ category: 'case study', isFollowUp: true, inputMode: 'voice' }),
    ).toBe(60);
  });

  it('text mode: regular question gets 120s', () => {
    expect(
      getTimeLimitSeconds({ category: 'technical', isFollowUp: false, inputMode: 'text' }),
    ).toBe(120);
  });

  it('text mode: case study base gets 180s', () => {
    expect(
      getTimeLimitSeconds({ category: 'case study', isFollowUp: false, inputMode: 'text' }),
    ).toBe(180);
  });

  it('text mode: follow-ups are always 120s', () => {
    expect(
      getTimeLimitSeconds({ category: 'case study', isFollowUp: true, inputMode: 'text' }),
    ).toBe(120);
  });

  it('always returns a positive number', () => {
    const v = getTimeLimitSeconds({ category: null, isFollowUp: false, inputMode: 'voice' });
    expect(typeof v).toBe('number');
    expect(v).toBeGreaterThan(0);
  });
});
