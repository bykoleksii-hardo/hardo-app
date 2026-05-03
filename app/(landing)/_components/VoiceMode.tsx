export default function VoiceMode() {
  return (
    <section id="voice" className="border-t border-line bg-cream/60">
      <div className="max-w-page mx-auto px-6 py-20 grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <div className="kicker mb-3">Voice mode</div>
          <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em]">
            Answer out loud. Like the real room.
          </h2>
          <p className="mt-5 text-ink-2 leading-relaxed max-w-lg">
            Whisper transcribes every word. The model lets you finish your sentence {'\u2014'} it does not interrupt mid-word. Pace, filler, and jargon hygiene are scored on delivery, not just on the words.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink-2">
            <span>{'\u2022'} Whisper STT</span>
            <span>{'\u2022'} 2-minute answer cap</span>
            <span>{'\u2022'} No mid-word interrupts</span>
          </div>
        </div>

        <div className="relative">
          <div className="border border-line bg-paper rounded-md shadow-[0_1px_0_rgba(14,30,54,0.04)]">
            <div className="border-b border-line px-5 py-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted">
              <span>Q 04 / 12</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] inline-block animate-pulse" />
                Recording
              </span>
            </div>
            <div className="px-5 py-6">
              <p className="font-serif text-[19px] leading-snug text-ink">
                Walk me through how you would value a no-revenue, pre-IPO biotech with one Phase II asset.
              </p>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-widest text-muted flex items-center justify-between">
                <span>1:42 / 2:00</span>
                <span>Filler {'\u00b7'} 0.4 / min</span>
              </div>
              <div className="mt-3 h-px bg-line" />
              <p className="mt-5 text-[14px] text-ink-2 leading-relaxed italic">
                {'\u201c'}I{'\u2019'}d lean on a risk-adjusted NPV. Build a peak-sales curve for the asset, apply a probability of success by phase {'\u2014'} Phase II to launch is roughly 15% in oncology{'\u2026'}{'\u201d'}
              </p>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-widest text-muted">
                Whisper {'\u00b7'} live transcript
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
