'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Level = 'intern' | 'analyst' | 'associate';

const LEVELS: Array<{ id: Level; title: string; tagline: string; pitch: string; tags: string[]; sample: { q: string; phase: string; grade: string }; tone: string }> = [
  {
    id: 'intern',
    title: 'Intern',
    tagline: 'First superday season. Build muscle on the basics before the real heat.',
    pitch: "Foundations of accounting, valuation, and a soft fit-check. No deal walk-throughs - we keep follow-ups gentle and let you build muscle before the real heat.",
    tags: ['3 statements', 'Comps & DCF basics', 'Why banking', 'Soft fit'],
    sample: { q: 'Walk me through how $10 of depreciation flows through the three statements. Take your time - I want to hear the logic, not just the numbers.', phase: 'Accounting', grade: 'B-' },
    tone: 'foundations',
  },
  {
    id: 'analyst',
    title: 'Analyst',
    tagline: 'Where the offer gets won. Live deal walks, technicals, and the curveballs.',
    pitch: "Live deal walk-throughs, sharper technicals, and the kind of follow-ups that decide whether you get the offer. Most popular bucket.",
    tags: ['Walk me through a deal', 'LBO mechanics', 'M&A accretion', 'Industry view'],
    sample: { q: "Walk me through your most recent LBO. Why this capital structure, and what's the exit multiple assumption you're least comfortable with?", phase: 'Private Equity / LBO', grade: 'A-' },
    tone: 'deal-walks',
  },
  {
    id: 'associate',
    title: 'Associate',
    tagline: 'Lateral, post-MBA, or just mean. Adversarial follow-ups and tight defenses.',
    pitch: "Adversarial follow-ups. Industry-level pattern recognition. The interviewer who interrupts your DCF to ask why you picked a 9% WACC.",
    tags: ['Sector pattern recognition', 'Negotiation posture', 'Process management', 'Hard valuation'],
    sample: { q: "I don't buy your DCF terminal value. Defend the 2.5% growth rate against the consensus sector outlook - and tell me which assumption you'd flex first if the senior banker pushed back.", phase: 'Valuation', grade: 'B' },
    tone: 'under-fire',
  },
];

export function SetupClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Level>('analyst');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = LEVELS.find((l) => l.id === selected)!;

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selected }),
      });
      const j = await res.json();
      if (!res.ok || !j.interview_id) throw new Error(j.error || 'Failed to start interview');
      router.push(`/interview/${j.interview_id}`);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-12 py-8 border-b border-[#f5efe2]/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#f5efe2]/40 flex items-center justify-center font-playfair text-lg italic">H</div>
          <span className="tracking-[0.18em] text-sm">HARDO</span>
        </div>
        <div className="text-xs tracking-[0.18em] text-[#f5efe2]/55">{userEmail.toUpperCase()}</div>
      </div>

      <main className="max-w-[1320px] mx-auto px-12 py-16">
        <div className="mb-12">
          <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-4">- PICK YOUR ROOM</div>
          <h1 className="font-playfair text-5xl leading-[1.05]">
            Choose the <span className="italic text-[#d4a04a]">level</span> that matches today.
          </h1>
          <p className="mt-4 text-[#f5efe2]/65 max-w-xl text-lg">
            Twelve questions either way. Same generic IB superday flow - fit, technicals, deal walks, a curveball.
            What changes is how hard the room hits back.
          </p>
        </div>

        {/* THREE LEVEL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEVELS.map((lvl) => {
            const isActive = lvl.id === selected;
            return (
              <button
                key={lvl.id}
                onClick={() => setSelected(lvl.id)}
                className={`text-left rounded-sm border transition-all p-7 flex flex-col ${
                  isActive
                    ? 'border-[#d4a04a] bg-[#0e1c33]'
                    : 'border-[#f5efe2]/15 hover:border-[#f5efe2]/35 bg-transparent'
                }`}
                aria-pressed={isActive}
              >
                <div className="mb-6 h-80 rounded-sm border border-[#f5efe2]/10 overflow-hidden relative">
                  <img
                    src={`/levels/${lvl.id}.png`}
                    alt={`${lvl.title} interview illustration`}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-[10px] tracking-[0.22em] text-[#f5efe2]/75">
                    {lvl.id === 'intern' ? 'MORNING ROOM' : lvl.id === 'analyst' ? 'BOARDROOM' : 'LATE NIGHT'}
                  </div>
                </div>

                <h2 className="font-playfair text-3xl italic mb-3">{lvl.title}</h2>
                <p className="text-sm text-[#f5efe2]/70 leading-relaxed mb-5 flex-1">{lvl.tagline}</p>
                <div className="flex items-center justify-between text-[11px] tracking-[0.18em]">
                  <span className="text-[#d4a04a]">- 12 QUESTIONS</span>
                  <span className="text-[#f5efe2]/45">{lvl.tone.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* PREVIEW SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 mt-14">
          <div className="border-t border-[#f5efe2]/10 pt-8">
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/55 mb-5">
              WHAT YOU'LL GET <span className="text-[#d4a04a]">- {active.title.toUpperCase()}</span>
            </div>
            <p className="font-playfair text-2xl leading-[1.4] text-[#f5efe2]/95">{active.pitch}</p>
            <div className="flex flex-wrap gap-2 mt-6">
              {active.tags.map((t) => (
                <span key={t} className="text-[11px] tracking-[0.18em] text-[#f5efe2]/65 border border-[#f5efe2]/15 px-3 py-1.5">
                  - {t.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#0e1c33] border border-[#f5efe2]/10 rounded-sm p-7">
            <div className="flex items-center justify-between mb-5 text-[11px] tracking-[0.22em]">
              <span className="text-[#f5efe2]/55">SAMPLE QUESTION</span>
              <span className="text-[#d4a04a]">- {active.title.toUpperCase()}</span>
            </div>
            <p className="font-playfair text-lg leading-[1.5] text-[#f5efe2]/95">{active.sample.q}</p>
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#f5efe2]/10 text-[11px] tracking-[0.18em] text-[#f5efe2]/55">
              <span>Q?? / 12 - {active.sample.phase.toUpperCase()}</span>
              <span>GRADED VS. {active.sample.grade}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 flex items-center justify-between">
          <div className="text-xs tracking-[0.18em] text-[#f5efe2]/55">
            THE CLOCK STARTS WHEN YOU HIT START. NO PAUSES BETWEEN QUESTIONS.
          </div>
          <button
            onClick={start}
            disabled={loading}
            className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-9 py-4 rounded-sm hover:bg-[#c8923a] transition-colors disabled:opacity-60"
          >
            {loading ? 'Preparing your room...' : `Start ${active.title} interview ->`}
          </button>
        </div>

        {error && (
          <div className="mt-6 text-sm text-[#e89292] border border-[#e89292]/40 px-4 py-3 rounded-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
