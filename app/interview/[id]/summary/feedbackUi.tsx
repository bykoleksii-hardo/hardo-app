/* Shared presentational pieces for the scorecard feedback UI, used by both the
   Overall feedback block and the per-question cards so positives and negatives
   read the same everywhere: a green check for strengths, a red arrow for
   things to fix, inside a tinted panel. Pure presentational — no client state. */

export function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17 17 7" /><path d="M8 7h9v9" />
    </svg>
  );
}

export function FeedbackPanel({ tone, label, items }: { tone: 'pos' | 'neg'; label: string; items: string[] }) {
  const pos = tone === 'pos';
  const color = pos ? '#1F6F3D' : '#9C2E2E';
  const single = items.length <= 1;
  return (
    <div className="rounded-md border bg-paper/60 px-4 py-3.5" style={{ borderColor: `${color}33` }}>
      <div className="flex items-center gap-2 mb-2.5" style={{ color }}>
        <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full" style={{ background: `${color}1A` }}>
          {pos ? <Check /> : <Arrow />}
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{label}</span>
      </div>
      {single ? (
        <p className="text-ink/80 text-[13.5px] leading-[1.6]">{items[0] ?? ''}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2 text-ink/80 text-[13.5px] leading-[1.55]">
              <span className="shrink-0 mt-[7px] w-1 h-1 rounded-full" style={{ background: color }} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---- Rubric axes (the 0-4 scores behind the block grade) ---- */

// Axis keys are canonical; the labels differ by rubric kind (technical vs fit).
export const RUBRIC_AXIS_LABELS: Record<'technical' | 'fit', Record<string, string>> = {
  technical: { correctness: 'Correctness', depth: 'Depth', structure: 'Structure', communication: 'Communication' },
  fit: { correctness: 'Substance', depth: 'Specificity', structure: 'Structure', communication: 'Communication' },
};
const AXIS_ORDER = ['correctness', 'depth', 'structure', 'communication'] as const;

export type RubricAxisView = { key: string; label: string; value: number };

// Build the ordered, labelled axes from a stored rubric object. Returns null if
// any axis is missing/non-numeric (e.g. legacy blocks graded before the rubric).
export function buildRubricAxes(
  rubric: Record<string, number> | null | undefined,
  kind: 'technical' | 'fit',
): RubricAxisView[] | null {
  if (!rubric) return null;
  const labels = RUBRIC_AXIS_LABELS[kind] ?? RUBRIC_AXIS_LABELS.technical;
  const axes: RubricAxisView[] = [];
  for (const k of AXIS_ORDER) {
    const v = rubric[k];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    axes.push({ key: k, label: labels[k], value: v });
  }
  return axes;
}

// Compact labelled bars for the four rubric axes. Values are 0..max (default 4);
// fractional values (aggregate profiles) render fine. Colour cues the level.
export function RubricBars({ axes, max = 4 }: { axes: RubricAxisView[]; max?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
      {axes.map((a) => {
        const v = Math.max(0, Math.min(max, a.value));
        const pct = (v / max) * 100;
        const color = v >= 3 ? '#1F6F3D' : v >= 2 ? '#A85A1F' : '#9C2E2E';
        const shown = Number.isInteger(v) ? String(v) : v.toFixed(1);
        return (
          <div key={a.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-ink/55">{a.label}</span>
              <span className="font-mono text-[10px] text-ink/45">{shown}<span className="text-ink/25">/{max}</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: pct + '%', background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
