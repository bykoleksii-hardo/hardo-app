const steps = [
  {
    n: '01',
    title: 'Pick a level and a mode.',
    body: 'Intern, Analyst, or Associate. Voice if you want the real-room pressure, text if you want to type your way through the case.',
    visual: 'levels' as const,
  },
  {
    n: '02',
    title: 'Sit twelve questions.',
    body: 'Technicals, behavioral, a deal walk, a curveball. Up to two follow-ups per question, five on the case.',
    visual: 'wave' as const,
  },
  {
    n: '03',
    title: 'Get graded against the bar.',
    body: 'Letter grade per question, four-phase scorecard, follow-up depth, and one of four hire calls.',
    visual: 'grade' as const,
  },
];

function StepVisual({ kind }: { kind: 'levels' | 'wave' | 'grade' }) {
  if (kind === 'levels') {
    return (
      <div className="step-visual">
        <div className="lvl-chips">
          <span className="lvl-chip">Intern</span>
          <span className="lvl-chip on">Analyst</span>
          <span className="lvl-chip gold">Associate</span>
        </div>
        <span className="mt-2.5 block">Selected · <b>Analyst · M&amp;A round</b></span>
      </div>
    );
  }
  if (kind === 'wave') {
    const heights = [6, 11, 16, 9, 18, 22, 13, 7, 15, 19, 24, 16, 10, 8, 13, 17, 11, 14];
    return (
      <div className="step-visual">
        <div className="wave">
          {heights.map((h, i) => (
            <i key={i} style={{ height: `${h}px` }} />
          ))}
        </div>
        <span className="mt-2.5 block">Voice · <b>1:42 / 2:00</b> · transcribing</span>
      </div>
    );
  }
  return (
    <div className="step-visual">
      <div className="mini-grade">
        <span className="g">{'A\u2212'}</span>
        <span className="desc"><b>Leaning hire</b>Verdict · Session #047</span>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-line bg-cream/40">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">— How it works</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-2xl">
          Three steps. No fluff.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          Every session is graded against the same bar real banking interviewers use: a letter grade per question, four-phase scorecard, follow-up depth, and one of four calls.
        </p>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 border-t border-line">
          {steps.map((s) => (
            <div key={s.n} className="step-cell">
              <div className="font-mono text-[11px] tracking-[0.18em] text-gold font-medium uppercase">{s.n}</div>
              <h3 className="mt-3 font-serif text-[24px] font-normal leading-snug tracking-[-0.01em] text-ink">{s.title}</h3>
              <p className="mt-3 text-[14.5px] text-ink-2 leading-relaxed max-w-[38ch]">{s.body}</p>
              <StepVisual kind={s.visual} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
