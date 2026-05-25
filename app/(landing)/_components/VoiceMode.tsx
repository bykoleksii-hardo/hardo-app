import Reveal from '@/app/_components/Reveal';

const BAR_COUNT = 56;
function makeBars() {
  const bars: Array<{ h: number; d: number }> = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const s = Math.sin(i * 0.42) * 0.5 + 0.5;        // 0..1
    const t = Math.sin(i * 0.18 + 1.7) * 0.4 + 0.6;  // 0.2..1
    const h = Math.max(4, Math.round(4 + s * t * 22)); // 4..26 px
    const d = 0.6 + ((i * 73) % 60) / 100;             // 0.6..1.2 s delay
    bars.push({ h, d });
  }
  return bars;
}
const BARS = makeBars();

export default function VoiceMode() {
  return (
    <section id="voice" className="border-t border-line bg-cream/60">
      <Reveal>
        <div className="max-w-page mx-auto px-6 py-20 grid gap-12 md:gap-20 md:grid-cols-[1fr_1.18fr] md:items-center">
          <div>
            <div className="eyebrow mb-5">Voice mode</div>
            <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-[14ch]">
              Answer out loud. Like{' '}
              <span className="italic-gold">the real room</span>
              <span className="text-gold">.</span>
            </h2>
            <p className="mt-6 text-[16px] text-ink-2 leading-relaxed max-w-lg">
              Whisper transcribes every word. <em className="italic">The model lets you finish your sentence</em> {'\u2014'} it does not interrupt mid-word. Pace, filler, and jargon hygiene are scored on delivery, not just on the words.
            </p>
            <p className="pull-quote mt-8 max-w-lg">
              {'\u201c'}Hesitation is data. So is the breath before you commit to a number.{'\u201d'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink-2 font-mono uppercase tracking-widest text-[color:var(--muted)]">
              <span>{'\u00b7'} Whisper STT</span>
              <span>{'\u00b7'} 2-minute answer cap</span>
              <span>{'\u00b7'} No mid-word interrupts</span>
            </div>
          </div>

          <div className="vcard">
            <div className="vcard__tab">Live</div>
            <div className="vcard__head">
              <span>Q 04 / 12</span>
              <span className="vcard__rec">Recording</span>
            </div>
            <p className="vcard__question">
              Walk me through how you would value a <em>no-revenue, pre-IPO biotech</em> with one Phase II asset.
            </p>
            <div className="vcard__meter">
              <div className="vcard__mic" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                </svg>
              </div>
              <div className="vcard__wave" aria-hidden>
                {BARS.map((b, i) => (
                  <i key={i} style={{ height: b.h + 'px', animationDelay: '-' + b.d + 's' }} />
                ))}
              </div>
              <div className="vcard__time">
                <b>1:42</b> <span className="cap">/ 2:00 cap</span>
              </div>
            </div>
            <div className="vcard__transcript-label">Whisper {'\u00b7'} live transcript</div>
            <div className="vcard__transcript">
              {'\u201c'}I{'\u2019'}d lean on a risk-adjusted NPV. Build a peak-sales curve for the asset, apply a <em>probability of success by phase</em> {'\u2014'} Phase II to launch is roughly 15% in oncology
              <span className="vcard__caret" aria-hidden />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
