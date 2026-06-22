'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { VaultData, VaultQuestion } from '@/lib/vault/queries';

const ALL = '__all__';

// Per-question reveal stagger, capped so a long grid doesn't crawl in.
function delay(i: number): string {
  return `${Math.min(i, 14) * 38}ms`;
}

function gradeTone(grade: string | null): string {
  if (!grade) return 'text-muted border-line';
  const head = grade[0];
  if (head === 'A') return 'text-[#2F7D4F] border-[#2F7D4F]/45';
  if (head === 'B') return 'text-[#B88736] border-[#B88736]/50';
  if (head === 'C') return 'text-[#9A6F26] border-[#9A6F26]/45';
  return 'text-[#B4452F] border-[#B4452F]/45';
}

// Sealed dossier: the topic is labelled, the question itself is redacted.
function LockedCard({ q, serial, i }: { q: VaultQuestion; serial: string; i: number }) {
  return (
    <article
      className="vault-card vault-card--locked vault-anim"
      style={{ animationDelay: delay(i) }}
      aria-label={`Sealed question in ${q.category}`}
    >
      <div className="vault-top">
        <span className="vault-serial">{serial}</span>
        <span className="vault-seal" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
      </div>
      <span className="vault-cat vault-cat--muted block mb-3.5">{q.category}</span>
      <div className="vault-redact" aria-hidden>
        <span style={{ width: '94%' }} />
        <span style={{ width: '83%' }} />
        <span style={{ width: '47%' }} />
      </div>
      <p className="vault-locklabel">Sealed &middot; meet it in a round to open</p>
    </article>
  );
}

// Opened dossier: a crisp serif question, foil grade chip if it has been answered.
function UnlockedCard({ q, serial, i }: { q: VaultQuestion; serial: string; i: number }) {
  return (
    <Link
      href={`/vault/${q.id}`}
      className="vault-card vault-anim group"
      style={{ animationDelay: delay(i) }}
    >
      <div className="vault-top">
        <span className="vault-serial">{serial}</span>
        <span className="vault-cat">{q.category}</span>
      </div>
      <p className="vault-q">{q.question}</p>
      <div className="vault-foot">
        <span className="vault-sub">{q.subtopic ?? 'Opened'}</span>
        {q.bestGrade ? (
          <span className={`vault-grade ${gradeTone(q.bestGrade)}`}>{q.bestGrade}</span>
        ) : (
          <span className="vault-sub !tracking-[0.12em] text-gold shrink-0">Study {'→'}</span>
        )}
      </div>
    </Link>
  );
}

export function VaultClient({ data, isPaid }: { data: VaultData; isPaid: boolean }) {
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);

  // Stable catalogue serial per question (its position in the full ordered set),
  // so a card keeps the same number regardless of the active filter.
  const serialById = useMemo(() => {
    const m = new Map<number, string>();
    data.questions.forEach((q, idx) => m.set(q.id, String(idx + 1).padStart(3, '0')));
    return m;
  }, [data.questions]);

  const filtered = useMemo(() => {
    return data.questions.filter((q) => {
      if (activeCat !== ALL && q.category !== activeCat) return false;
      if (onlyUnlocked && !q.unlocked) return false;
      return true;
    });
  }, [data.questions, activeCat, onlyUnlocked]);

  const pct = data.totalCount > 0 ? Math.round((data.unlockedCount / data.totalCount) * 100) : 0;

  return (
    <main className="max-w-[1320px] mx-auto px-5 md:px-12 py-10 md:py-16">
      <header className="relative overflow-hidden mb-9 md:mb-12">
        <div className="bg-orb" aria-hidden style={{ top: '-170px', right: '-110px' }} />
        <div className="relative z-[1] md:flex md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <div className="eyebrow mb-4">Question Vault</div>
            <h1 className="font-serif text-[34px] md:text-[46px] font-light leading-[1.04] tracking-[-0.02em] text-ink">
              Every question, <span className="italic-gold">one at a time</span>
              <span className="text-gold">.</span>
            </h1>
            <p className="mt-5 text-[15px] text-ink-2 leading-relaxed max-w-xl">
              Each question unlocks the moment you meet it in a round. Once it&rsquo;s open, study it on its own
              and push deeper than a normal interview &mdash; up to five follow-ups, graded the same way.
            </p>
          </div>

          <div className="mt-8 md:mt-0 shrink-0 md:text-right">
            <div className="vault-fig">
              {data.unlockedCount}
              <span className="of"> / {data.totalCount}</span>
            </div>
            <div className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Unlocked &middot; {pct}%
            </div>
          </div>
        </div>

        <div className="relative z-[1] vault-meter mt-7" aria-hidden>
          <i style={{ width: `${pct}%` }} />
        </div>

        {!isPaid && (
          <div className="relative z-[1] mt-5 inline-flex items-center gap-2 border border-gold-line bg-gold-soft rounded-[3px] px-4 py-2.5">
            <span className="text-[13px] text-ink-2">Deep dives are a paid feature.</span>
            <a href="/upgrade" className="text-[13px] text-gold underline underline-offset-2 hover:text-gold-2">
              Upgrade
            </a>
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-8 pb-5 border-b border-line">
        <button type="button" onClick={() => setActiveCat(ALL)} aria-pressed={activeCat === ALL} className="vault-pill">
          All
        </button>
        {data.categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCat(cat)}
            aria-pressed={activeCat === cat}
            className="vault-pill"
          >
            {cat}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] text-ink-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyUnlocked}
            onChange={(e) => setOnlyUnlocked(e.target.checked)}
            className="accent-gold"
          />
          Unlocked only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-line rounded-[3px] bg-cream/40 py-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">No entries match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q, i) =>
            q.unlocked ? (
              <UnlockedCard key={q.id} q={q} serial={serialById.get(q.id) ?? ''} i={i} />
            ) : (
              <LockedCard key={q.id} q={q} serial={serialById.get(q.id) ?? ''} i={i} />
            ),
          )}
        </div>
      )}
    </main>
  );
}
