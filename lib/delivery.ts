// Delivery analysis for voice answers. All signals are derived deterministically
// from the STT word timestamps ({word,start,end}) + total duration — no extra
// audio model, no audio retention. Used to (a) ground the Communication rubric
// axis in real pace/fillers/pauses and (b) show a "Delivery" panel on the
// scorecard. Everything degrades gracefully: missing data -> null -> text-only
// judgement, as before.

export type WordStamp = { word: string; start: number; end: number };

export type DeliveryMetrics = {
  duration_sec: number;
  word_count: number;
  wpm: number;                       // words per minute
  pace: 'slow' | 'measured' | 'brisk' | 'rushed';
  filler_count: number;
  filler_per_min: number;
  fillers: Record<string, number>;   // breakdown by filler token/phrase
  long_pauses: number;               // inter-word gaps > 1.5s
  longest_pause_sec: number;
  silence_ratio: number;             // total inter-word gap time / duration (0..1)
  hedge_count: number;               // hedging phrases ("I think", "maybe", ...)
};

const SINGLE_FILLERS = new Set([
  'um', 'umm', 'ummm', 'uh', 'uhh', 'uhhh', 'er', 'erm', 'ah', 'ahh', 'hmm', 'hmmm',
  'like', 'basically', 'literally', 'actually',
]);
const MULTI_FILLERS = ['you know what i mean', 'you know', 'i mean', 'kind of', 'sort of', 'kinda', 'sorta'];
const HEDGES = ['i think', 'i guess', 'i believe', 'i would say', 'i suppose', 'not sure', "i'm not sure", 'maybe', 'perhaps', 'probably', 'it depends'];
const LONG_PAUSE_SEC = 1.5;

function paceBand(wpm: number): DeliveryMetrics['pace'] {
  if (wpm < 110) return 'slow';
  if (wpm < 160) return 'measured';
  if (wpm <= 185) return 'brisk';
  return 'rushed';
}

function countPhrases(haystack: string, phrases: string[]): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;
  for (const p of phrases) {
    const re = new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
    const n = (haystack.match(re) || []).length;
    if (n > 0) { breakdown[p] = n; total += n; }
  }
  return { total, breakdown };
}

/**
 * Compute delivery metrics for a single spoken answer. Returns null when there
 * is not enough signal (no duration and no words).
 */
export function computeDelivery(words: WordStamp[] | null | undefined, durationSec: number, text: string): DeliveryMetrics | null {
  const w = Array.isArray(words) ? words.filter(x => x && typeof x.start === 'number' && typeof x.end === 'number') : [];
  const norm = (text || '').toLowerCase();
  const tokens = norm.match(/[a-z']+/g) || [];
  const wordCount = w.length > 0 ? w.length : tokens.length;
  const dur = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
  if (wordCount === 0 && dur === 0) return null;

  const wpm = dur > 0 ? Math.round((wordCount / dur) * 60) : 0;

  // Fillers: single tokens + multi-word phrases (counted on the normalized text).
  const fillers: Record<string, number> = {};
  let fillerCount = 0;
  for (const t of tokens) {
    if (SINGLE_FILLERS.has(t)) { fillers[t] = (fillers[t] || 0) + 1; fillerCount++; }
  }
  const multi = countPhrases(' ' + norm + ' ', MULTI_FILLERS);
  for (const [k, n] of Object.entries(multi.breakdown)) { fillers[k] = (fillers[k] || 0) + n; }
  fillerCount += multi.total;

  // Pauses from inter-word gaps.
  let longPauses = 0, longestPause = 0, silence = 0;
  for (let i = 1; i < w.length; i++) {
    const gap = w[i].start - w[i - 1].end;
    if (gap > 0) {
      silence += gap;
      if (gap > longestPause) longestPause = gap;
      if (gap > LONG_PAUSE_SEC) longPauses++;
    }
  }

  const hedges = countPhrases(' ' + norm + ' ', HEDGES);

  return {
    duration_sec: Math.round(dur),
    word_count: wordCount,
    wpm,
    pace: paceBand(wpm),
    filler_count: fillerCount,
    filler_per_min: dur > 0 ? Math.round((fillerCount / dur) * 60 * 10) / 10 : 0,
    fillers,
    long_pauses: longPauses,
    longest_pause_sec: Math.round(longestPause * 10) / 10,
    silence_ratio: dur > 0 ? Math.max(0, Math.min(1, Math.round((silence / dur) * 100) / 100)) : 0,
    hedge_count: hedges.total,
  };
}

/**
 * Aggregate per-answer delivery into a single block-level view (recomputes
 * rates from totals so a long answer isn't averaged against a short one).
 */
export function aggregateDelivery(list: Array<DeliveryMetrics | null | undefined>): DeliveryMetrics | null {
  const items = list.filter((m): m is DeliveryMetrics => !!m);
  if (items.length === 0) return null;
  let dur = 0, words = 0, fillerCount = 0, longPauses = 0, longest = 0, silence = 0, hedge = 0;
  const fillers: Record<string, number> = {};
  for (const m of items) {
    dur += m.duration_sec;
    words += m.word_count;
    fillerCount += m.filler_count;
    longPauses += m.long_pauses;
    longest = Math.max(longest, m.longest_pause_sec);
    silence += m.silence_ratio * m.duration_sec;
    hedge += m.hedge_count;
    for (const [k, n] of Object.entries(m.fillers)) fillers[k] = (fillers[k] || 0) + n;
  }
  const wpm = dur > 0 ? Math.round((words / dur) * 60) : 0;
  return {
    duration_sec: dur,
    word_count: words,
    wpm,
    pace: paceBand(wpm),
    filler_count: fillerCount,
    filler_per_min: dur > 0 ? Math.round((fillerCount / dur) * 60 * 10) / 10 : 0,
    fillers,
    long_pauses: longPauses,
    longest_pause_sec: longest,
    silence_ratio: dur > 0 ? Math.max(0, Math.min(1, Math.round((silence / dur) * 100) / 100)) : 0,
    hedge_count: hedge,
  };
}

// Coerce a delivery object that round-tripped through the client back into a
// trusted shape: numeric fields are forced to finite numbers, and filler keys
// are restricted to a safe charset (defends the grading prompt from injection
// via crafted filler labels). Returns null if there is no usable signal.
export function sanitizeDelivery(raw: unknown): DeliveryMetrics | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const fillers: Record<string, number> = {};
  if (r.fillers && typeof r.fillers === 'object') {
    for (const [k, v] of Object.entries(r.fillers as Record<string, unknown>)) {
      if (/^[a-z' ]{1,24}$/.test(k) && num(v) > 0) fillers[k] = Math.round(num(v));
    }
  }
  const pace = (['slow', 'measured', 'brisk', 'rushed'] as const).includes(r.pace as never)
    ? (r.pace as DeliveryMetrics['pace']) : 'measured';
  const m: DeliveryMetrics = {
    duration_sec: Math.round(num(r.duration_sec)),
    word_count: Math.round(num(r.word_count)),
    wpm: Math.round(num(r.wpm)),
    pace,
    filler_count: Math.round(num(r.filler_count)),
    filler_per_min: Math.round(num(r.filler_per_min) * 10) / 10,
    fillers,
    long_pauses: Math.round(num(r.long_pauses)),
    longest_pause_sec: Math.round(num(r.longest_pause_sec) * 10) / 10,
    silence_ratio: Math.max(0, Math.min(1, num(r.silence_ratio))),
    hedge_count: Math.round(num(r.hedge_count)),
  };
  if (m.word_count === 0 && m.duration_sec === 0) return null;
  return m;
}

// One-line summary for the grading prompt (Communication axis grounding).
export function formatDeliveryForPrompt(m: DeliveryMetrics): string {
  const topFillers = Object.entries(m.fillers).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, n]) => `${k}×${n}`).join(', ');
  const parts = [
    `pace ~${m.wpm} wpm (${m.pace})`,
    `${m.filler_count} filler words (${m.filler_per_min}/min${topFillers ? ': ' + topFillers : ''})`,
    `${m.long_pauses} long pause(s)${m.longest_pause_sec ? ` (max ${m.longest_pause_sec}s)` : ''}`,
    `${m.hedge_count} hedging phrase(s)`,
  ];
  return parts.join('; ');
}
