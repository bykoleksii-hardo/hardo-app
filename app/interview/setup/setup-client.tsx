'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type Level = 'intern' | 'analyst' | 'associate';
type InputMode = 'text' | 'voice';

const INPUT_MODES: Array<{ id: InputMode; title: string; tagline: string; bullets: string[] }> = [
  {
    id: 'text',
    title: 'Type your answers',
    tagline: 'Quiet rooms, late-night practice, or when you want to think on the page.',
    bullets: ['2 minutes per question', '3 minutes for the case study', 'Edit before you send'],
  },
  {
    id: 'voice',
    title: 'Speak your answers',
    tagline: 'Closer to the real superday: think out loud, sound natural, hit the timer.',
    bullets: ['1 minute per question', '2 minutes for the case study', 'Microphone required - transcript is editable'],
  },
];

type Quota = {
  plan: 'free' | 'paid';
  interviews_used: number;
  free_limit: number;
  allowed_levels: Level[];
  can_start: boolean;
};

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
    tagline: 'Day-one analyst seat. Quick, technical, no excuses.',
    pitch: 'Modeling instincts, deal mechanics, and a real fit pressure-check. Expect crisp follow-ups and at least one curveball where the right answer is "I don\u2019t know, but here\u2019s how I\u2019d figure it out."',
    tags: ['LBO mechanics', 'Accretion / dilution', 'Deal walk-through', 'Curveball'],
    sample: { q: "You're modeling an LBO of a $200M EBITDA company at 9.0x entry, 5.5x leverage, exit at 9.5x in year 5. Walk me through how you'd ballpark the IRR in your head.", phase: 'Case', grade: 'B' },
    tone: 'execution',
  },
  {
    id: 'associate',
    title: 'Associate',
    tagline: 'You sit between the MD and the model. The room expects judgment.',
    pitch: "Sector reads, capital structure trade-offs, and how you'd shape a process. Follow-ups dig: why this advisor, why now, what you'd push back on.",
    tags: ['Capital structure', 'Process strategy', 'Sector view', 'Negotiation read'],
    sample: { q: "A sponsor asks you whether to take their $300M EBITDA portco public at 10x or sell to a strategic at 11.5x. They want one number, then your reasoning. Go.", phase: 'Case', grade: 'B+' },
    tone: 'judgment',
  },
];

export function SetupClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Level>('intern');
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'level' | 'mode'>('level');
  const [inputMode, setInputMode] = useState<InputMode>('text');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/quota', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled && r.ok) setQuota(j);
      } catch {}
      finally { if (!cancelled) setQuotaLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const active = LEVELS.find((l) => l.id === selected)!;
  const isLevelLocked = (lvl: Level) => quota ? !quota.allowed_levels.includes(lvl) : false;
  const blockedByLimit = quota ? !quota.can_start : false;
  const ctaDisabled = loading || quotaLoading || isLevelLocked(selected) || blockedByLimit;
  const ctaLabel = (() => {
    if (loading) return 'Preparing your room...';
    if (quotaLoading) return 'Checking access...';
    if (isLevelLocked(selected)) return 'Upgrade to unlock';
    if (blockedByLimit) return 'Upgrade to continue';
    return `Start ${active.title} interview \u2192`;
  })();

  async function start() {
    if (isLevelLocked(selected) || blockedByLimit) {
      router.push('/upgrade');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selected, input_mode: inputMode }),
      });
      const j = await res.json();
      if (res.status === 403 && (j.reason === 'free_limit_reached' || j.reason === 'level_locked')) {
        router.push('/upgrade');
        return;
      }
      if (!res.ok || !j.interview_id) throw new Error(j.error || 'Failed to start interview');
      router.push(`/interview/${j.interview_id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-12 py-8 border-b border-[#f5efe2]/10">
        <Brand size="sm" href="/" />
        <div className="flex items-center gap-4 text-xs tracking-[0.18em] text-[#f5efe2]/55">
          {quota && (
            <span className={quota.plan === 'paid' ? 'text-[#d4a04a]' : 'text-[#f5efe2]/55'}>
              {quota.plan === 'paid' ? 'PAID' : `FREE \u00b7 ${Math.max(0, quota.free_limit - quota.interviews_used)}/${quota.free_limit} LEFT`}
            </span>
          )}
          <a href="/profile" className="text-[#f5efe2]/55 hover:text-[#d4a04a] transition-colors">PROFILE</a>
          <span>{userEmail.toUpperCase()}</span>
          <button onClick={signOut} className="text-[#f5efe2]/55 hover:text-[#d4a04a] transition-colors">SIGN OUT</button>
        </div>
      </div>

      <main className="max-w-[1320px] mx-auto px-12 py-16">
        <div className="mb-12">
          <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-4">- PICK YOUR ROOM</div>
          <h1 className="font-playfair text-5xl leading-[1.05]">
            Choose the <span className="italic text-[#d4a04a]">level</span> that matches today.
          </h1>
          <p className="mt-4 text-[#f5efe2]/65 max-w-xl text-lg">
            Twelve questions. Same superday flow - fit, technicals, deal walks, a curveball.
            What changes is how hard the room hits back.
          </p>
        </div>

        {/* THREE LEVEL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEVELS.map((lvl) => {
            const isActive = lvl.id === selected;
            const locked = isLevelLocked(lvl.id);
            return (
              <button
                key={lvl.id}
                onClick={() => setSelected(lvl.id)}
                className={`text-left rounded-sm border transition-all p-7 flex flex-col relative ${
                  isActive
                    ? 'border-[#d4a04a] bg-[#0e1c33]'
                    : 'border-[#f5efe2]/15 hover:border-[#f5efe2]/35 bg-transparent'
                } ${locked ? 'opacity-75' : ''}`}
                aria-pressed={isActive}
              >
                {locked && (
                  <div className="absolute top-4 right-4 z-10 text-[10px] tracking-[0.22em] text-[#d4a04a] border border-[#d4a04a]/60 px-2.5 py-1 bg-[#0a1628]/80">
                    PAID
                  </div>
                )}
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
              <span>SAMPLE - {active.sample.phase.toUpperCase()}</span>
              <span>BENCHMARK: {active.sample.grade}</span>
            </div>
          </div>
        </div>

        {/* MODE PICKER (revealed after level is confirmed) */}
        {stage === 'mode' && (
          <div className="mt-14">
            <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-4">- HOW WILL YOU ANSWER?</div>
            <h2 className="font-playfair text-3xl leading-[1.1] mb-2">
              Pick your <span className="italic text-[#d4a04a]">delivery</span> for this round.
            </h2>
            <p className="text-[#f5efe2]/60 text-sm max-w-xl mb-8">
              You can’t switch mid-interview - choose the one closest to how you want to drill today.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INPUT_MODES.map((m) => {
                const isActive = m.id === inputMode;
                return (
                  <button
                    key={m.id}
                    onClick={() => setInputMode(m.id)}
                    className={`text-left rounded-sm border p-7 transition-all ${isActive ? 'border-[#d4a04a] bg-[#0e1c33]' : 'border-[#f5efe2]/15 hover:border-[#f5efe2]/35 bg-transparent'}`}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between mb-4 text-[10px] tracking-[0.22em]">
                      <span className={isActive ? 'text-[#d4a04a]' : 'text-[#f5efe2]/55'}>
                        {m.id === 'voice' ? '- VOICE' : '- TEXT'}
                      </span>
                      {isActive && <span className="text-[#d4a04a]">SELECTED</span>}
                    </div>
                    <h3 className="font-playfair text-2xl mb-2">{m.title}</h3>
                    <p className="text-sm text-[#f5efe2]/70 mb-5 leading-relaxed">{m.tagline}</p>
                    <ul className="space-y-1.5 text-[11px] tracking-[0.18em] text-[#f5efe2]/65">
                      {m.bullets.map((b) => (
                        <li key={b}>- {b.toUpperCase()}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 flex items-center justify-between flex-wrap gap-6">
          <div className="text-xs tracking-[0.18em] text-[#f5efe2]/55">
            {blockedByLimit && !isLevelLocked(selected)
              ? 'YOUR FREE INTERVIEW IS USED. UPGRADE TO KEEP DRILLING.'
              : isLevelLocked(selected)
              ? 'THIS LEVEL UNLOCKS WITH THE PAID PLAN.'
              : stage === 'level'
              ? 'LOCK IN THE LEVEL FIRST. NEXT STEP: PICK TEXT OR VOICE.'
              : "START WHEN READY. THE INTERVIEWER WON'T HOLD BACK."}
          </div>
          <div className="flex items-center gap-3">
            {stage === 'mode' && (
              <button
                onClick={() => setStage('level')}
                className="text-[#f5efe2]/65 hover:text-[#d4a04a] tracking-[0.05em] px-5 py-4"
                type="button"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (stage === 'level') {
                  if (isLevelLocked(selected) || blockedByLimit) { router.push('/upgrade'); return; }
                  setStage('mode');
                } else {
                  start();
                }
              }}
              disabled={ctaDisabled}
              className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-9 py-4 rounded-sm hover:bg-[#c8923a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {stage === 'level'
                ? (isLevelLocked(selected) || blockedByLimit ? ctaLabel : 'Continue \u2192')
                : ctaLabel}
            </button>
          </div>
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
