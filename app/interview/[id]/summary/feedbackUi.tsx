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
