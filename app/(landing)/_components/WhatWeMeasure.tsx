const phases = [
  { name: 'Letter grade', body: 'A+ to F on every answer. The same scale a real reviewer scribbles in the margin — hidden until the end.' },
  { name: 'Skill radar', body: 'Six axes that mirror IB territory: Accounting, Valuation, Corp Finance, M&A / Case, PE / LBO, Behavioral.' },
  { name: 'Follow-up depth', body: 'How far you held under pressure before the answer started to thin. Up to two probes on a normal question, five on a case.' },
  { name: 'Hire call', body: 'One of four: hire, leaning hire, leaning no-hire, no-hire. Same bar real teams use — no engagement scores.' },
];

export default function WhatWeMeasure() {
  return (
    <section className="border-t border-line">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">What we measure</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-3xl">
          One scorecard. One verdict.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          The same notes a real interviewer carries on a notepad: a letter, a radar, follow-up depth, a hire call. No vanity metrics, no engagement scores.
        </p>
        <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {phases.map((p) => (
            <div key={p.name} className="border-t border-line pt-5">
              <div className="font-mono text-[11px] tracking-widest text-muted uppercase">{p.name}</div>
              <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-3 text-[12px] font-mono uppercase tracking-widest text-muted">
          <span className="border border-line rounded-full px-3 py-1">Letter grade per question</span>
          <span className="border border-line rounded-full px-3 py-1">Follow-up depth 0{'\u20135'}</span>
          <span className="border border-line rounded-full px-3 py-1">4-level hire scale</span>
          <span className="border border-line rounded-full px-3 py-1">Saved to profile</span>
        </div>
      </div>
    </section>
  );
}
