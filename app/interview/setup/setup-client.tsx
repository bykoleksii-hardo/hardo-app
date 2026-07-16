'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiError, formatApiError, type ApiErrorShape } from '@/lib/observability/api-client';
import { INTERVIEW_TOPICS, TOPIC_LABELS, type TopicKey } from '@/lib/interview/topics';

type Level = 'intern' | 'analyst' | 'associate';
type InputMode = 'text' | 'voice';
type Format = 'full' | 'topic';

const FORMATS: Array<{ id: Format; label: string; title: string; tagline: string; count: string; meta: string; recipe: string }> = [
  {
    id: 'full',
    label: '— THE FULL ROUND',
    title: 'Full interview',
    tagline: 'The complete superday flow — the real rehearsal, graded end to end with a hire call.',
    count: '12',
    meta: '12 QUESTIONS · ≈ 35–45 MIN',
    recipe: 'FIT · TECHNICALS · CASE · CURVEBALL',
  },
  {
    id: 'topic',
    label: '— TOPIC SPRINT',
    title: 'Topic sprint',
    tagline: 'Three questions on one topic you pick. Drill a weakness, get graded, get out.',
    count: '3',
    meta: '3 QUESTIONS · ≈ 10 MIN',
    recipe: 'ONE TOPIC · EASIEST FIRST',
  },
];

/** Editorial section header: numbered kicker + hairline rule. */
function SectionKicker({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <span className="text-[11px] tracking-[0.22em] text-gold whitespace-nowrap">{children}</span>
      <span className="h-px flex-1 bg-ink/10" aria-hidden />
    </div>
  );
}

/** Radio-style selection dot: reads faster than a SELECTED label. */
function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
        active ? 'border-gold' : 'border-ink/25 group-hover:border-ink/45'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full bg-gold transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      />
    </span>
  );
}

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
    bullets: ['1 minute per question', '2 minutes for the case study', 'Microphone required — transcript is editable'],
  },
];

type Quota = {
  plan: 'free' | 'paid';
  interviews_used: number;
  free_limit: number;
  allowed_levels: Level[];
  can_start: boolean;
  topic_used?: number;
  topic_free_limit?: number;
  can_start_topic?: boolean;
};

const LEVELS: Array<{ id: Level; title: string; tagline: string; pitch: string; tags: string[]; sample: { q: string; phase: string; grade: string }; tone: string }> = [
  {
    id: 'intern',
    title: 'Intern',
    tagline: 'First superday season. Build muscle on the basics before the real heat.',
    pitch: "Foundations of accounting, valuation, and a soft fit-check. No deal walk-throughs — we keep follow-ups gentle and let you build muscle before the real heat.",
    tags: ['3 statements', 'Comps & DCF basics', 'Why banking', 'Soft fit'],
    sample: { q: 'Walk me through how $10 of depreciation flows through the three statements. Take your time — I want to hear the logic, not just the numbers.', phase: 'Accounting', grade: 'B' },
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
    sample: { q: "A sponsor asks you whether to take their $300M EBITDA portco public at 10x or sell to a strategic at 11.5x. They want one number, then your reasoning. Go.", phase: 'Case', grade: 'B' },
    tone: 'judgment',
  },
];

export function SetupClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Level>('intern');
  const [format, setFormat] = useState<Format>('full');
  const [topicCat, setTopicCat] = useState<TopicKey | null>(null);
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

  const active = LEVELS.find((l) => l.id === selected)!;
  const isLevelLocked = (lvl: Level) => quota ? !quota.allowed_levels.includes(lvl) : false;
  // Standard interviews and topic sprints are metered separately on the free plan.
  const blockedByLimit = quota
    ? (format === 'full' ? !quota.can_start : quota.can_start_topic === false)
    : false;
  const needsTopic = format === 'topic' && !topicCat;
  const ctaDisabled = loading || quotaLoading || isLevelLocked(selected) || blockedByLimit || needsTopic;
  const ctaLabel = (() => {
    if (loading) return 'Preparing your room...';
    if (quotaLoading) return 'Checking access...';
    if (isLevelLocked(selected)) return 'Upgrade to unlock';
    if (blockedByLimit) return 'Upgrade to continue';
    if (format === 'topic') return `Start ${topicCat ? TOPIC_LABELS[topicCat] : 'topic'} sprint \u2192`;
    return `Start ${active.title} interview \u2192`;
  })();

  async function start() {
    if (isLevelLocked(selected) || blockedByLimit) {
      router.push('/upgrade');
      return;
    }
    if (format === 'topic' && !topicCat) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: selected,
          input_mode: inputMode,
          mode: format === 'topic' ? 'topic' : 'standard',
          ...(format === 'topic' && topicCat ? { topic_category: topicCat } : {}),
        }),
      });
      const j = await res.json();
      if (res.status === 403 && (j.reason === 'free_limit_reached' || j.reason === 'level_locked')) {
        router.push('/upgrade');
        return;
      }
      if (!res.ok || !j.interview_id) {
        // Already consumed body as `j`; reuse it.
        const reqId = res.headers.get('x-request-id');
        const shape: ApiErrorShape = { status: res.status, message: j.error || 'Failed to start interview', requestId: reqId, raw: j };
        throw new Error(formatApiError(shape));
      }
      router.push(`/interview/${j.interview_id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <main className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-10 lg:py-16">
        <div className="mb-12">
          <div className="anim-rise d1 text-[11px] tracking-[0.22em] text-gold mb-4">— BUILD YOUR SESSION</div>
          <h1 className="anim-rise d2 font-serif text-4xl sm:text-5xl leading-[1.05]">
            Choose the <span className="italic text-gold">session</span> that matches today.
          </h1>
          <p className="anim-rise d3 mt-4 text-ink/65 max-w-xl text-lg">
            {format === 'full'
              ? 'Twelve questions. Same superday flow — fit, technicals, deal walks, a curveball. What changes is how hard the room hits back.'
              : "Three questions on one topic, about ten minutes. A focused rep for the days you can't give the room a full hour."}
          </p>
        </div>

        {/* FORMAT CARDS */}
        <div className="mb-12">
          <SectionKicker>01 — PICK YOUR FORMAT</SectionKicker>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FORMATS.map((f) => {
              const isActive = f.id === format;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`group text-left rounded-sm border p-7 transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 active:scale-[0.99] ${
                    isActive ? 'border-gold bg-cream shadow-[0_22px_45px_-30px_rgba(184,135,54,0.55)]' : 'border-ink/15 hover:border-ink/40 bg-transparent'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center justify-between mb-6 text-[10px] tracking-[0.22em]">
                    <span className={isActive ? 'text-gold' : 'text-ink/55'}>{f.label}</span>
                    <RadioDot active={isActive} />
                  </div>
                  <div className="flex items-end justify-between gap-6">
                    <div className="min-w-0">
                      <h2 className="font-serif text-3xl mb-2">{f.title}</h2>
                      <p className="text-sm text-ink/70 leading-relaxed">{f.tagline}</p>
                    </div>
                    <div
                      aria-hidden
                      className={`font-serif italic leading-[0.75] text-[84px] tracking-[-0.05em] shrink-0 select-none transition-colors duration-300 ${
                        isActive ? 'text-gold' : 'text-ink/[0.13] group-hover:text-ink/25'
                      }`}
                    >
                      {f.count}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-ink/10 flex items-center justify-between gap-x-4 gap-y-1 flex-wrap text-[10px] tracking-[0.2em]">
                    <span className={isActive ? 'text-gold-2' : 'text-ink/50'}>{f.meta}</span>
                    <span className="text-ink/40">{f.recipe}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TOPIC PICKER (topic sprint only) */}
        {format === 'topic' && (
          <div className="mb-12">
            <SectionKicker>02 — PICK YOUR TOPIC</SectionKicker>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INTERVIEW_TOPICS.map((t, i) => {
                const isActive = topicCat === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTopicCat(t.key)}
                    style={{ animationDelay: `${i * 45}ms` }}
                    className={`anim-rise group text-left rounded-sm border p-5 transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 active:scale-[0.99] ${
                      isActive ? 'border-gold bg-cream shadow-[0_18px_38px_-28px_rgba(184,135,54,0.5)]' : 'border-ink/15 hover:border-ink/40 bg-transparent'
                    }`}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        aria-hidden
                        className={`font-serif italic text-[15px] transition-colors duration-200 ${isActive ? 'text-gold' : 'text-ink/35'}`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <RadioDot active={isActive} />
                    </div>
                    <h3 className="font-serif text-[21px] leading-tight mb-1.5">{t.label}</h3>
                    <p className="text-[13px] text-ink/60 leading-relaxed">{t.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <SectionKicker>{format === 'topic' ? '03 — PICK YOUR ROOM' : '02 — PICK YOUR ROOM'}</SectionKicker>

        {/* THREE LEVEL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEVELS.map((lvl) => {
            const isActive = lvl.id === selected;
            const locked = isLevelLocked(lvl.id);
            return (
              <button
                key={lvl.id}
                onClick={() => setSelected(lvl.id)}
                className={`group text-left rounded-sm border transition-all duration-300 p-7 flex flex-col relative hover:-translate-y-1 ${
                  isActive
                    ? 'border-gold bg-cream shadow-[0_22px_45px_-30px_rgba(184,135,54,0.55)]'
                    : 'border-ink/15 hover:border-ink/40 bg-transparent'
                } ${locked ? 'opacity-75' : ''}`}
                aria-pressed={isActive}
              >
                {locked && (
                  <div className="absolute top-4 right-4 z-10 text-[10px] tracking-[0.22em] text-gold border border-gold/60 px-2.5 py-1 bg-paper/80">
                    HARDO
                  </div>
                )}
                <div className="mb-6 h-64 sm:h-80 rounded-sm border border-ink/10 overflow-hidden relative bg-cream">
                  <img
                    src={`/levels/${lvl.id}.png`}
                    alt={`${lvl.title} interview illustration`}
                    width={1402}
                    height={1122}
                    loading={lvl.id === 'intern' ? 'eager' : 'lazy'}
                    fetchPriority={lvl.id === 'intern' ? 'high' : 'auto'}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-[10px] tracking-[0.22em] text-ink/75">
                    {lvl.id === 'intern' ? 'MORNING ROOM' : lvl.id === 'analyst' ? 'BOARDROOM' : 'LATE NIGHT'}
                  </div>
                </div>

                <h2 className="font-serif text-3xl italic mb-3">{lvl.title}</h2>
                <p className="text-sm text-ink/70 leading-relaxed mb-5 flex-1">{lvl.tagline}</p>
                <div className="flex items-center justify-between text-[11px] tracking-[0.18em]">
                  <span className="text-gold">— {format === 'full' ? '12' : '3'} QUESTIONS</span>
                  <span className="text-ink/45">{lvl.tone.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* PREVIEW SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 mt-14">
          <div className="border-t border-ink/10 pt-8">
            <div className="text-[11px] tracking-[0.22em] text-ink/55 mb-5">
              WHAT YOU'LL GET <span className="text-gold">— {active.title.toUpperCase()}</span>
            </div>
            <p className="font-serif text-2xl leading-[1.4] text-ink/95">{active.pitch}</p>
            <div className="flex flex-wrap gap-2 mt-6">
              {active.tags.map((t) => (
                <span key={t} className="text-[11px] tracking-[0.18em] text-ink/65 border border-ink/15 px-3 py-1.5">
                  — {t.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-cream border border-ink/10 rounded-sm p-7">
            <div className="flex items-center justify-between mb-5 text-[11px] tracking-[0.22em]">
              <span className="text-ink/55">SAMPLE QUESTION</span>
              <span className="text-gold">— {active.title.toUpperCase()}</span>
            </div>
            <p className="font-serif text-lg leading-[1.5] text-ink/95">{active.sample.q}</p>
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-ink/10 text-[11px] tracking-[0.18em] text-ink/55">
              <span>SAMPLE — {active.sample.phase.toUpperCase()}</span>
              <span>BENCHMARK: {active.sample.grade}</span>
            </div>
          </div>
        </div>

        {/* MODE PICKER (revealed after level is confirmed) */}
        {stage === 'mode' && (
          <div className="mt-14">
            <SectionKicker>{format === 'topic' ? '04 — HOW WILL YOU ANSWER?' : '03 — HOW WILL YOU ANSWER?'}</SectionKicker>
            <h2 className="font-serif text-3xl leading-[1.1] mb-2">
              Pick your <span className="italic text-gold">delivery</span> for this round.
            </h2>
            <p className="text-ink/60 text-sm max-w-xl mb-8">
              You can’t switch mid-interview — choose the one closest to how you want to drill today.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INPUT_MODES.map((m) => {
                const isActive = m.id === inputMode;
                return (
                  <button
                    key={m.id}
                    onClick={() => setInputMode(m.id)}
                    className={`group text-left rounded-sm border p-7 transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 active:scale-[0.99] ${isActive ? 'border-gold bg-cream shadow-[0_18px_38px_-28px_rgba(184,135,54,0.5)]' : 'border-ink/15 hover:border-ink/40 bg-transparent'}`}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between mb-4 text-[10px] tracking-[0.22em]">
                      <span className={isActive ? 'text-gold' : 'text-ink/55'}>
                        {m.id === 'voice' ? '— VOICE' : '— TEXT'}
                      </span>
                      <RadioDot active={isActive} />
                    </div>
                    <h3 className="font-serif text-2xl mb-2">{m.title}</h3>
                    <p className="text-sm text-ink/70 mb-5 leading-relaxed">{m.tagline}</p>
                    <ul className="space-y-1.5 text-[11px] tracking-[0.18em] text-ink/65">
                      {m.bullets.map((b) => (
                        <li key={b}>— {b.toUpperCase()}</li>
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
          <div className="text-xs tracking-[0.18em] text-ink/55">
            {blockedByLimit && !isLevelLocked(selected)
              ? (format === 'topic'
                ? 'YOUR FREE TOPIC SPRINT IS USED. UPGRADE TO KEEP DRILLING.'
                : 'YOUR FREE INTERVIEW IS USED. UPGRADE TO KEEP DRILLING.')
              : isLevelLocked(selected)
              ? 'THIS LEVEL UNLOCKS WITH THE HARDO PLAN.'
              : needsTopic && stage === 'level'
              ? 'PICK YOUR TOPIC, LOCK IN THE LEVEL, THEN CONTINUE.'
              : stage === 'level'
              ? 'LOCK IN THE LEVEL FIRST. NEXT STEP: PICK TEXT OR VOICE.'
              : "START WHEN READY. THE INTERVIEWER WON'T HOLD BACK."}
          </div>
          <div className="flex items-center gap-3">
            {stage === 'mode' && (
              <button
                onClick={() => setStage('level')}
                className="text-ink/65 hover:text-gold tracking-[0.05em] px-5 py-4"
                type="button"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (stage === 'level') {
                  if (isLevelLocked(selected) || blockedByLimit) { router.push('/upgrade'); return; }
                  if (needsTopic) return;
                  setStage('mode');
                } else {
                  start();
                }
              }}
              disabled={ctaDisabled}
              className="bg-gold text-paper font-medium tracking-[0.05em] px-9 py-4 rounded-sm hover:bg-[#9C6F1E] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {stage === 'level'
                ? (isLevelLocked(selected) || blockedByLimit ? ctaLabel : 'Continue \u2192')
                : ctaLabel}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-6 text-sm text-[#B23B3B] border border-[#B23B3B]/40 px-4 py-3 rounded-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
