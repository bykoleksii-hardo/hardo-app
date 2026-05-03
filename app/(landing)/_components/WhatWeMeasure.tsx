const phases = [
  { name: 'Technical', body: 'Mechanics, accuracy, and cross-checks. Did the answer hold up under a sanity test?' },
  { name: 'Structure', body: 'Answer-first framing, clear signposting, and recovery when the question pivots.' },
  { name: 'Communication', body: 'Pace, filler, jargon hygiene. Scored on delivery, not just on the words.' },
  { name: 'Case depth', body: 'How far you held under follow-ups before the answer started to thin.' },
];

export default function WhatWeMeasure() {
  return (
    <section className="border-t border-line">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">What we measure</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-3xl">
          Four phases. One verdict.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          The same axes a real interviewer carries on a notepad. No vanity metrics, no engagement scores.
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
