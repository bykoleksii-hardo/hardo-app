import Reveal from '@/app/_components/Reveal';
import { baseFaq, pricingFaq } from './faq-data';

export default function FAQ({ showPricing = true }: { showPricing?: boolean }) {
  const items = showPricing ? [...baseFaq, ...pricingFaq] : baseFaq;
  return (
    <section id="faq" className="border-t border-line">
      <Reveal>
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">FAQ</div>
        <h2 className="font-serif text-[28px] md:text-[34px] font-light leading-[1.1] tracking-[-0.015em]">
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
      </Reveal>
    </section>
  );
}
