'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { AdminQuestion, Region } from '@/lib/admin/questions';

type Props = { questions: AdminQuestion[] };

const REGION_STYLES: Record<Region, string> = {
  US: 'border-[#c2410c] text-[#c2410c]',
  EMEA: 'border-[#1d4ed8] text-[#1d4ed8]',
  Global: 'border-line text-muted',
};

export default function QuestionsTable({ questions }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const [diff, setDiff] = useState<string>('');
  const [region, setRegion] = useState<string>('');

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const it of questions) s.add(it.category);
    return Array.from(s).sort();
  }, [questions]);

  const difficulties = useMemo(() => {
    const s = new Set<number>();
    for (const it of questions) if (typeof it.difficulty === 'number') s.add(it.difficulty);
    return Array.from(s).sort((a, b) => a - b);
  }, [questions]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return questions.filter((it) => {
      if (cat && it.category !== cat) return false;
      if (diff && String(it.difficulty ?? '') !== diff) return false;
      if (region && it.region !== region) return false;
      if (qLower) {
        const hay = (it.question + ' ' + it.category + ' ' + (it.subtopic ?? '')).toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [questions, q, cat, diff, region]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search questions, categories, subtopics..."
          className="flex-1 min-w-[260px] text-[14px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="text-[13px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          className="text-[13px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
        >
          <option value="">All difficulties</option>
          {difficulties.map((d) => (
            <option key={d} value={String(d)}>Difficulty {d}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="text-[13px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
        >
          <option value="">All regions</option>
          <option value="US">US only</option>
          <option value="EMEA">EMEA only</option>
          <option value="Global">Global</option>
        </select>
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {filtered.length} match{filtered.length === 1 ? '' : 'es'}
        </div>
      </div>

      <div className="border border-line rounded overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead className="bg-cream/50 text-left">
            <tr className="font-mono text-[10.5px] uppercase tracking-widest text-muted">
              <th className="px-4 py-3 w-16">ID</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3 w-44">Category / Subtopic</th>
              <th className="px-4 py-3 w-24">Difficulty</th>
              <th className="px-4 py-3 w-24">Region</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No questions match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id} className="border-t border-line hover:bg-cream/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{it.id}</td>
                  <td className="px-4 py-3 leading-relaxed">{it.question}</td>
                  <td className="px-4 py-3 text-[12.5px] text-ink-2">
                    <div>{it.category}</div>
                    {it.subtopic && <div className="text-muted">{it.subtopic}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px]">
                    {it.difficulty ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block font-mono text-[10.5px] uppercase tracking-widest border rounded px-2 py-0.5 ${REGION_STYLES[it.region]}`}>
                      {it.region}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/questions/${it.id}`}
                      className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-ink hover:text-[#a87a1f] border border-line hover:border-[#a87a1f] px-2.5 py-1 rounded transition"
                    >
                      Test <span aria-hidden>{'→'}</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
