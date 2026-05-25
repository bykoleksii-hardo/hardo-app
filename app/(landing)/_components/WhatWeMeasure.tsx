import Reveal from '@/app/_components/Reveal';

const rows = [
  {
    cat: 'Accounting',
    desc: 'Three statements that tie. Working-capital and non-cash items that *don\u2019t lie*.',
    weight: '20%',
  },
  {
    cat: 'Valuation',
    desc: 'DCF mechanics, comps that match, and the *terminal-value* tail you can defend.',
    weight: '25%',
  },
  {
    cat: 'Corporate Finance',
    desc: 'WACC build, capital structure, dilution math \u2014 on a *clean napkin*.',
    weight: '15%',
  },
  {
    cat: 'M&A / Case',
    desc: 'Deal logic, accretion/dilution, *synergy* quantification that survives a follow-up.',
    weight: '25%',
  },
  {
    cat: 'Behavioral',
    desc: 'Answer-first framing. *Held up* under three follow-ups, not just one.',
    weight: '15%',
  },
];

function renderDesc(text: string) {
  // Render *italic* segments with gold italics. Plain string, single pass.
  const parts: Array<{ italic: boolean; text: string }> = [];
  let buf = '';
  let italic = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '*') {
      if (buf) parts.push({ italic, text: buf });
      buf = '';
      italic = !italic;
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push({ italic, text: buf });
  return parts.map((p, i) => p.italic ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>);
}

export default function WhatWeMeasure() {
  return (
    <section id="measure" className="border-t border-line">
      <Reveal>
        <div className="max-w-page mx-auto px-6 py-20">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20 items-start">
            <div>
              <div className="eyebrow mb-5">What we measure</div>
              <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-[14ch]">
                One scorecard.{' '}
                <span className="italic-gold">One verdict</span>
                <span className="text-gold">.</span>
              </h2>
              <p className="mt-6 text-[16px] text-ink-2 leading-relaxed max-w-md">
                The same notes a real interviewer carries on a notepad: a letter, a radar, follow-up depth, a hire call. No vanity metrics, no engagement scores.
              </p>
              <p className="pull-quote mt-8 max-w-md">
                {'\u201c'}Letter grade per answer. Same scale a real reviewer scribbles in the margin {'\u2014'} hidden until the end.{'\u201d'}
              </p>
            </div>

            <div>
              {rows.map((r) => (
                <div key={r.cat} className="measure-row">
                  <div className="cat">{r.cat}</div>
                  <div className="desc">{renderDesc(r.desc)}</div>
                  <div className="weight">{r.weight}</div>
                </div>
              ))}

              <div className="mt-10 flex flex-wrap items-center gap-3 text-[12px] font-mono uppercase tracking-widest text-[color:var(--muted)]">
                <span className="border border-line rounded-full px-3 py-1">Letter grade per question</span>
                <span className="border border-line rounded-full px-3 py-1">Follow-up depth 0{'\u2013'}5</span>
                <span className="border border-line rounded-full px-3 py-1">4-level hire scale</span>
                <span className="border border-line rounded-full px-3 py-1">Saved to profile</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
