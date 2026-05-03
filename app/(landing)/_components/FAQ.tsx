type Variant = 'anon' | 'free' | 'paid';

const FAQ_BASE = [
  { q: 'How long is one interview?', a: '12 questions. Plan for roughly 30{\u201345} minutes if you type, 20{\u201330} if you answer by voice. You can pause between questions.' },
  { q: 'Does my answer get cut off?', a: 'You get 2{\u20133} minutes per text answer and 1{\u20132} minutes per voice answer. The model lets you finish your sentence; it does not interrupt mid-word.' },
  { q: 'How are follow-ups decided?', a: 'Up to two follow-ups on a normal question, up to five on the case. The model probes only when your answer leaves a real gap {\u2014} not to pad the session.' },
  { q: 'When do I see my grade?', a: 'Letter grades stay hidden during the interview so you stay in flow. The full scorecard, follow-up depth, and hire recommendation appear at the end.' },
  { q: 'What levels are there?', a: 'Intern, Analyst, and Associate. Each pulls a different question pool and is graded against a different bar.' },
];

const FAQ_PRICING = [
  { q: 'How much does Hardo cost?', a: '$12 per month. Cancel anytime from your account page. No annual contract.' },
  { q: 'Do I need a card to try it?', a: 'No. Sign up gives you one full Intern interview, no card required.' },
];

export default function FAQ({ variant }: { variant: Variant }) {
  const items = variant === 'paid' ? FAQ_BASE : [...FAQ_BASE, ...FAQ_PRICING];
  return (
    <section id="faq" className="py-24 border-t border-[#f5efe2]/10">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">FAQ</div>
        <h2 className="font-serif text-4xl md:text-5xl text-[#f5efe2] mb-12">Common questions.</h2>
        <div className="divide-y divide-[#f5efe2]/10 border-y border-[#f5efe2]/10">
          {items.map((item, i) => (
            <details key={i} className="group py-5">
              <summary className="cursor-pointer flex justify-between items-center text-[#f5efe2] font-medium list-none">
                <span>{item.q}</span>
                <span className="text-[#d4a04a] group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-[#f5efe2]/70 text-sm leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
