type Item = { q: string; a: string };

const baseItems: Item[] = [
  { q: 'How long is one interview?', a: '12 questions. Plan for roughly 30\u201345 minutes if you type, 20\u201330 if you answer by voice. You can pause between questions.' },
  { q: 'Does my answer get cut off?', a: 'No. The model lets you finish your sentence in voice mode and never interrupts mid-word. Each answer has a soft 2-minute cap with a visible timer.' },
  { q: 'How are follow-ups decided?', a: 'Up to 2 follow-ups on standard questions, up to 5 on the case. The model only digs further if your last answer left an opening, exactly the way a real interviewer would.' },
  { q: 'When do I see my grade?', a: 'Letter grades stay hidden during the interview. The full scorecard \u2014 four phases, follow-up depth, written verdict \u2014 unlocks at the end and is saved to your profile.' },
  { q: 'What levels are there?', a: 'Three rooms: Intern, Analyst, and Associate. Each pulls from its own question pool and grades against the bar for that level.' },
];

const pricingItems: Item[] = [
  { q: 'How much does HARDO cost?', a: '$12 per month, billed monthly, cancel anytime. One full interview is free, no card required.' },
  { q: 'Do I need a card to try it?', a: 'No card on the free interview. You only enter payment when you choose to subscribe.' },
];

export default function FAQ({ showPricing = true }: { showPricing?: boolean }) {
  const items = showPricing ? [...baseItems, ...pricingItems] : baseItems;
  return (
    <section id="faq" className="border-t border-line">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">FAQ</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em]">
          Common questions.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          If you{'\u2019'}ve sat a real superday, you{'\u2019'}ll recognize most of this. If you haven{'\u2019'}t yet {'\u2014'} that{'\u2019'}s why you{'\u2019'}re here.
        </p>
        <div className="mt-12 max-w-3xl border-t border-line">
          {items.map((item, i) => (
            <details key={item.q} className="group border-b border-line py-5" {...(i === 0 ? { open: true } : {})}>
              <summary className="flex items-center justify-between gap-6 cursor-pointer">
                <span className="font-serif text-[20px] font-medium">{item.q}</span>
                <span className="font-mono text-[18px] text-muted group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-[15px] text-ink-2 leading-relaxed max-w-2xl">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
