export default function WhatWeMeasure() {
  const phases = [
    { label: 'Technical', body: 'Accounting, valuation, M&A mechanics, LBO. Wrong numbers and wrong concepts get flagged separately.' },
    { label: 'Structure', body: 'Do you frame an answer before you dive in? Do you signpost? Do you land the punchline?' },
    { label: 'Communication', body: 'Pace, filler, jargon hygiene. Voice answers transcribed via Whisper and scored on delivery.' },
    { label: 'Case', body: 'Up to five follow-ups stress-test depth, second-order thinking, and your willingness to push back.' },
  ];
  return (
    <section className="py-24 border-t border-[#f5efe2]/10 bg-[#050d1a]/60">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">What we measure</div>
        <h2 className="font-serif text-4xl md:text-5xl text-[#f5efe2] mb-4 max-w-2xl">Four phases. One hire decision.</h2>
        <p className="text-[#f5efe2]/70 max-w-2xl mb-12 leading-relaxed">
          Every interview ends with a scorecard built the way a real banker reviews a candidate {'\u2014'} not a generic chatbot rating.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {phases.map((p) => (
            <div key={p.label} className="border border-[#f5efe2]/10 rounded-lg p-6 bg-[#0a1628]/60">
              <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-2">{p.label}</div>
              <p className="text-[#f5efe2]/80 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 border border-[#d4a04a]/30 rounded-lg p-6 bg-[#d4a04a]/5">
          <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-2">Final recommendation</div>
          <p className="text-[#f5efe2]/80 text-sm leading-relaxed">
            One of four calls: <span className="text-[#f5efe2]">hire</span>, <span className="text-[#f5efe2]">leaning hire</span>, <span className="text-[#f5efe2]">leaning no-hire</span>, <span className="text-[#f5efe2]">no-hire</span>. Letter grades stay hidden mid-interview so you focus on the answer, not the score.
          </p>
        </div>
      </div>
    </section>
  );
}
