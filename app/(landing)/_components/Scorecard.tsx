const phases = [
  { name: 'Technical', grade: 'B+', note: 'Solid DCF mechanics. Missed terminal-value sanity check.' },
  { name: 'Structure', grade: 'A\u2212', note: 'Clear answer-first framing. Good signposting.' },
  { name: 'Communication', grade: 'B', note: 'Pace good. Some filler on the case.' },
  { name: 'Case depth', grade: 'B+', note: 'Held up under 3 follow-ups.' },
];

export default function Scorecard() {
  return (
    <div className="border border-line bg-paper rounded-md shadow-[0_1px_0_rgba(14,30,54,0.04)]">
      <div className="border-b border-line px-6 py-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-muted">
        <span>{'\u2014'} Scorecard {'\u00b7'} Session #047</span>
        <span>Graded</span>
      </div>
      <div className="px-6 py-6 grid gap-1">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-serif text-[22px] font-medium">Analyst {'\u00b7'} M&amp;A round</div>
            <div className="text-[12.5px] text-muted mt-1">Recent session {'\u00b7'} 38m {'\u00b7'} Voice</div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Final recommendation</div>
            <div className="mt-1 font-serif text-[22px] font-medium">Leaning hire</div>
          </div>
          <div className="font-serif text-[56px] font-light leading-none text-ink">A{'\u2212'}</div>
        </div>

        <div className="mt-6 grid divide-y divide-line border-t border-line">
          {phases.map((p) => (
            <div key={p.name} className="py-4 grid grid-cols-[110px_44px_1fr] items-start gap-4">
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted pt-1">{p.name}</div>
              <div className="font-serif text-[22px] font-medium leading-none">{p.grade}</div>
              <div className="text-[13px] text-ink-2 leading-snug">{p.note}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4 font-mono text-[10.5px] uppercase tracking-widest text-muted flex items-center justify-between">
          <span>Follow-up depth {'\u00b7'} 3.4 / 5</span>
          <span>4-phase scorecard</span>
        </div>
      </div>
    </div>
  );
}
