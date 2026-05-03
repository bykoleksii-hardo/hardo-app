const steps = [
  {
    n: '01',
    title: 'Pick a level and a mode.',
    body: 'Intern, Analyst, or Associate. Voice if you want the real-room pressure, text if you want to type your way through the case.',
  },
  {
    n: '02',
    title: 'Sit twelve questions.',
    body: 'Technicals, behavioral, a case. Up to two follow-ups on standard questions, up to five on the case. No hand-holding, no leading hints.',
  },
  {
    n: '03',
    title: 'Read your scorecard.',
    body: 'A four-phase grade, a follow-up depth score, and a written verdict on a four-level hire scale. Saved to your profile for next time.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-line bg-cream/40">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">How it works</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-2xl">
          Three steps. No fluff.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          Every session is graded against the same bar real banking interviewers use: a letter grade per question, four-phase scorecard, follow-up depth, and one of four calls.
        </p>
        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-line pt-6">
              <div className="font-mono text-[12px] tracking-widest text-muted">{s.n}</div>
              <h3 className="mt-3 font-serif text-[24px] font-medium leading-snug">{s.title}</h3>
              <p className="mt-3 text-[14.5px] text-ink-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
