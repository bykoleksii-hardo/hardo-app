export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Pick your level',
      body: 'Intern, Analyst, or Associate. Each level pulls a different question pool and grading bar {\u2014} the same bar real recruiters use.',
    },
    {
      num: '02',
      title: 'Answer with the clock running',
      body: '12 questions per session: technicals, behavioral, and a case. 2{\u20133} minutes per text answer, 1{\u20132} minutes when you talk. Up to 2 follow-ups per question, 5 on the case.',
    },
    {
      num: '03',
      title: 'Get graded against the bar',
      body: 'Letter grade per question, four-phase scorecard (technical, structure, communication, case), follow-up depth score, and a hire / leaning hire / leaning no-hire / no-hire recommendation.',
    },
  ];
  return (
    <section id="how" className="py-24 border-t border-[#f5efe2]/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">How it works</div>
        <h2 className="font-serif text-4xl md:text-5xl text-[#f5efe2] mb-12 max-w-2xl">Three steps. No fluff.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="border border-[#f5efe2]/10 rounded-lg p-8 bg-[#0a1628]/40">
              <div className="text-[#d4a04a] font-serif text-3xl mb-4">{s.num}</div>
              <div className="text-[#f5efe2] font-medium text-xl mb-3">{s.title}</div>
              <p className="text-[#f5efe2]/70 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
