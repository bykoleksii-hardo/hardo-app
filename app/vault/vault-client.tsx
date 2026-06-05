'use client';

import { useMemo, useState } from 'react';
import type { VaultData, VaultQuestion } from '@/lib/vault/queries';

const ALL = '__all__';

function gradeTone(grade: string | null): string {
  if (!grade) return 'text-muted border-line';
  const head = grade[0];
  if (head === 'A') return 'text-[#2F7D4F] border-[#2F7D4F]/40';
  if (head === 'B') return 'text-[#B88736] border-[#B88736]/45';
  if (head === 'C') return 'text-[#9A6F26] border-[#9A6F26]/40';
  return 'text-[#B4452F] border-[#B4452F]/40';
}

function LockedCard({ q }: { q: VaultQuestion }) {
  return (
    <div className="relative border border-line rounded-sm bg-cream/40 p-5 overflow-hidden select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{q.category}</span>
        <span aria-hidden className="text-muted text-[13px]">{'\u{1F512}'}</span>
      </div>
      <p className="text-[14px] leading-relaxed text-ink/35 blur-[5px] pointer-events-none line-clamp-3">
        {q.question}
      </p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Locked</p>
    </div>
  );
}

function UnlockedCard({ q }: { q: VaultQuestion }) {
  return (
    <div className="group border border-line rounded-sm bg-paper p-5 transition-colors hover:border-[#B88736]/50">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B88736]">{q.category}</span>
        {q.bestGrade ? (
          <span className={`font-mono text-[11px] px-1.5 py-0.5 border rounded-sm ${gradeTone(q.bestGrade)}`}>
            {q.bestGrade}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Unlocked</span>
        )}
      </div>
      <p className="font-serif text-[16px] leading-snug text-ink line-clamp-3">{q.question}</p>
      {q.subtopic && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{q.subtopic}</p>
      )}
    </div>
  );
}

export function VaultClient({ data, isPaid }: { data: VaultData; isPaid: boolean }) {
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);

  const filtered = useMemo(() => {
    return data.questions.filter((q) => {
      if (activeCat !== ALL && q.category !== activeCat) return false;
      if (onlyUnlocked && !q.unlocked) return false;
      return true;
    });
  }, [data.questions, activeCat, onlyUnlocked]);

  const pct = data.totalCount > 0 ? Math.round((data.unlockedCount / data.totalCount) * 100) : 0;

  return (
    <main className="max-w-[1320px] mx-auto px-5 md:px-12 py-10 md:py-14">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#B88736] mb-3">Question Vault</p>
        <h1 className="font-serif text-3xl md:text-4xl text-ink mb-3">Every question, one at a time.</h1>
        <p className="text-ink-2 max-w-2xl leading-relaxed">
          Questions unlock as you meet them in interviews. Once unlocked, you can study a question on its
          own and go deeper than a normal round &mdash; up to five follow-ups, graded the same way.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 max-w-md h-1.5 bg-cream rounded-full overflow-hidden">
            <div className="h-full bg-[#B88736] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-[12px] text-muted whitespace-nowrap">
            {data.unlockedCount} / {data.totalCount} unlocked
          </span>
        </div>

        {!isPaid && (
          <div className="mt-5 inline-flex items-center gap-2 border border-[#B88736]/35 bg-[#B88736]/[0.07] rounded-sm px-4 py-2.5">
            <span className="text-[13px] text-ink-2">Deep dives are a paid feature.</span>
            <a href="/upgrade" className="text-[13px] text-[#B88736] underline underline-offset-2 hover:text-[#9A6F26]">
              Upgrade
            </a>
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-7">
        <button
          type="button"
          onClick={() => setActiveCat(ALL)}
          className={`font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm border transition-colors ${activeCat === ALL ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-ink/40'}`}
        >
          All
        </button>
        {data.categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCat(cat)}
            className={`font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm border transition-colors ${activeCat === cat ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-ink/40'}`}
          >
            {cat}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] text-ink-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyUnlocked}
            onChange={(e) => setOnlyUnlocked(e.target.checked)}
            className="accent-[#B88736]"
          />
          Unlocked only
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-[14px] py-16 text-center">No questions match this filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q) =>
            q.unlocked ? <UnlockedCard key={q.id} q={q} /> : <LockedCard key={q.id} q={q} />,
          )}
        </div>
      )}
    </main>
  );
}
