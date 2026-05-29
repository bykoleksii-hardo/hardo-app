// Lightweight, dependency-free input validation helpers.
// Centralizes field-length limits so routes share consistent caps.
// (A broader Zod-based schema layer can adopt these constants later.)

export const LIMITS = {
  // Free-text the user types into an interview answer / message.
  ANSWER: 8000,
  // Short free-text fields (names, titles, single-line inputs).
  SHORT_TEXT: 200,
  // Medium free-text (bios, notes).
  MEDIUM_TEXT: 2000,
  // Maximum accepted JSON body size in bytes (defense against huge payloads).
  JSON_BODY_BYTES: 64 * 1024,
} as const;

/** True if a string exceeds the given max length (by character count). */
export function tooLong(value: unknown, max: number): boolean {
  return typeof value === 'string' && value.length > max;
}

/** Trim and hard-cap a string to `max` characters. Non-strings become ''. */
export function clampString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const t = value.trim();
  return t.length > max ? t.slice(0, max) : t;
}
