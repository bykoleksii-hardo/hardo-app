const phases = [
  { name: 'Accounting', grade: 'B+', note: 'Solid LIFO/FIFO mechanics. Missed working-capital sanity check.' },
  { name: 'Valuation', grade: 'A\u2212', note: 'Clean DCF setup. Good push on terminal-value assumptions.' },
  { name: 'Corporate Finance', grade: 'B+', note: 'WACC build was tight. Beta unlevering was rushed.' },
  { name: 'M&A / Case', grade: 'B', note: 'Reasonable deal logic. Synergy quantification thin.' },
  { name: 'Behavioral', grade: 'A\u2212', note: 'Answer-first framing. Held up under 3 follow-ups.' },
];

function gradeColor(g: string): string {
  const c = (g || '').trim().toUpperCase();
  if (!c) return 'text-[#11161E]/55';
  if (c.startsWith('A')) return 'text-[#1F6F3D]';
  if (c.startsWith('B')) return 'text-[#3F7A4A]';
  if (c.startsWith('C')) return 'text-[#A85A1F]';
  if (c.startsWith('D')) return 'text-[#9C2E2E]';
  if (c.startsWith('F')) return 'text-[#7A1F1F]';
  return 'text-[#11161E]/75';
}

export default function Scorecard() {
  return (
    <div className="border border-line bg-paper rounded-md shadow-[0_1px_0_rgba(14,30,54,0.04)]">
      <div className="border-b border-line px-6 py-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-muted">
        <span>{'\u2014'} Example output {'\u00b7'} Not your session</span>
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
              <div className={`font-serif text-[22px] font-medium leading-none ${gradeColor(p.grade)}`}>{p.grade}</div>
              <div className="text-[13px] text-[#11161E]/75 leading-snug">{p.note}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4 font-mono text-[10.5px] uppercase tracking-widest text-muted flex items-center justify-between">
          <span>Follow-up depth {'\u00b7'} 3.4 / 5</span>
          <span>Six-axis radar</span>
        </div>
      </div>
    </div>
  );
}
