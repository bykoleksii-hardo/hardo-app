'use client';

import { useMemo, useState } from 'react';

type StepRow = {
  id: string;
  order_index: number;
  is_follow_up: boolean;
  parent_step_id: string | null;
  custom_question: string | null;
  user_answer: string | null;
  ai_grade: string | null;
  ai_score: string | null;
  ai_feedback: string | null;
  ai_status: string | null;
  created_at: string | null;
  answered_at: string | null;
  time_limit_seconds: number | null;
  was_overtime: boolean | null;
  questions: { question: string; category: string; subtopic: string | null } | null;
};

type ParsedFeedback = {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
};

function formatPace(step: { created_at: string | null; answered_at: string | null; time_limit_seconds: number | null; was_overtime: boolean | null; }): { text: string; over: boolean } | null {
  if (!step.created_at || !step.answered_at) return null;
  const a = new Date(step.created_at).getTime();
  const b = new Date(step.answered_at).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  const elapsed = Math.max(0, Math.round((b - a) / 1000));
  const limit = step.time_limit_seconds ?? null;
  const over = !!step.was_overtime;
  const fmt = (s: number) => {
    const m = Math.floor(s/60); const r = s % 60;
    return String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0');
  };
  if (limit) return { text: fmt(elapsed) + ' of ' + fmt(limit), over };
  return { text: fmt(elapsed), over };
}

function parseFeedback(raw: string | null): { summary: string; strengths: string[]; weaknesses: string[] } | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as ParsedFeedback;
    return {
      summary: typeof j.summary === 'string' ? j.summary : '',
      strengths: Array.isArray(j.strengths) ? j.strengths : [],
      weaknesses: Array.isArray(j.weaknesses) ? j.weaknesses : [],
    };
  } catch {
    return { summary: raw, strengths: [], weaknesses: [] };
  }
}

type Props = {
  steps: StepRow[];
  isCompleted: boolean;
};

const ALL = '__ALL__';

export default function SummaryQuestions({ steps, isCompleted }: Props) {
  const [cat, setCat] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);

  const mainSteps = useMemo(() => steps.filter((s) => !s.is_follow_up), [steps]);

  const followUpsByParent = useMemo(() => {
    const map = new Map<string, StepRow[]>();
    for (const s of steps) {
      if (s.is_follow_up && s.parent_step_id) {
        const arr = map.get(s.parent_step_id) ?? [];
        arr.push(s);
        map.set(s.parent_step_id, arr);
      }
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.order_index - b.order_index);
      map.set(k, arr);
    }
    return map;
  }, [steps]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of mainSteps) {
      const c = (s.questions?.category ?? '').toString();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [mainSteps]);

  const grades = useMemo(() => {
    const set = new Set<string>();
    for (const s of mainSteps) {
      const g = (s.ai_grade ?? s.ai_score ?? '').toString().trim();
      if (g) set.add(g.charAt(0).toUpperCase());
    }
    return Array.from(set).sort();
  }, [mainSteps]);

  const filteredSteps = useMemo(() => {
    return mainSteps.filter((s) => {
      if (cat !== ALL) {
        const c = (s.questions?.category ?? '').toString();
        if (c !== cat) return false;
      }
      if (grade !== ALL) {
        const raw = (s.ai_grade ?? s.ai_score ?? '') as string;
        const g = raw.toString().trim().charAt(0).toUpperCase();
        if (g !== grade) return false;
      }
      return true;
    });
  }, [mainSteps, cat, grade]);

  const showFilters = mainSteps.length > 1 && (categories.length > 1 || grades.length > 1);
  const hasFilters = cat !== ALL || grade !== ALL;

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h2 className="font-playfair text-2xl">Question by question</h2>
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] tracking-[0.22em] text-[#11161E]/45">FILTER</span>
            {categories.length > 1 && (
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                aria-label="Filter by category"
                className="text-[12px] bg-transparent border border-[#11161E]/20 px-2 py-1 hover:border-[#B88736] focus:outline-none focus:border-[#B88736]"
              >
                <option value={ALL}>All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            )}
            {grades.length > 1 && (
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                aria-label="Filter by grade"
                className="text-[12px] bg-transparent border border-[#11161E]/20 px-2 py-1 hover:border-[#B88736] focus:outline-none focus:border-[#B88736]"
              >
                <option value={ALL}>All grades</option>
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setCat(ALL); setGrade(ALL); }}
                className="text-[11px] tracking-[0.22em] text-[#11161E]/55 hover:text-[#B88736] underline-offset-4 hover:underline"
              >
                CLEAR
              </button>
            )}
          </div>
        )}
      </div>

      {filteredSteps.length === 0 ? (
        <div className="border border-dashed border-[#11161E]/20 bg-[#F2ECDF]/30 p-8 text-center">
          <div className="text-[11px] tracking-[0.22em] text-[#11161E]/55 mb-2">— NO MATCHES</div>
          <p className="text-[#11161E]/65 text-[14px] mb-4">
            No questions match these filters.
          </p>
          <button
            type="button"
            onClick={() => { setCat(ALL); setGrade(ALL); }}
            className="text-[11px] tracking-[0.22em] border border-[#11161E]/20 px-4 py-2 hover:text-[#B88736] hover:border-[#B88736]"
          >
            CLEAR FILTERS
          </button>
        </div>
      ) : (
        <ol className="space-y-6">

          {filteredSteps.map((s) => {
            const followUps = followUpsByParent.get(s.id) ?? [];
            const fb = parseFeedback(s.ai_feedback);
            const grade = s.ai_grade ?? s.ai_score;
            return (
              <li key={s.id} className="border border-[#11161E]/10 bg-[#F2ECDF]/30 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-[11px] tracking-[0.22em] text-[#11161E]/55 mb-2 flex items-center gap-3">
                      <span>Q{String(s.order_index).padStart(2,'0')}{' · '}{(s.questions?.category ?? '').toUpperCase()}</span>
                      {(() => { const p = formatPace(s); if (!p) return null; return (
                        <span className={p.over ? 'text-[#d47a7a]' : 'text-[#9ab87a]'}>{p.over ? 'OVERTIME ' : ''}{p.text}</span>
                      ); })()}
                    </div>
                    <p className="font-playfair text-lg leading-[1.5]">{s.questions?.question}</p>
                  </div>
                  {isCompleted && (() => {
                    const g = (grade ?? '').toString().trim();
                    const tone = !g ? 'border-[#11161E]/20 text-[#11161E]/55'
                      : g.startsWith('A') ? 'border-[#1F6F3D]/40 text-[#1F6F3D] bg-[#1F6F3D]/8'
                      : g.startsWith('B') ? 'border-[#3F7A4A]/40 text-[#3F7A4A] bg-[#3F7A4A]/8'
                      : g.startsWith('C') ? 'border-[#A85A1F]/40 text-[#A85A1F] bg-[#A85A1F]/8'
                      : g === 'D' ? 'border-[#9C2E2E]/40 text-[#9C2E2E] bg-[#9C2E2E]/8'
                      : g === 'F' ? 'border-[#7A1F1F]/50 text-[#7A1F1F] bg-[#7A1F1F]/10'
                      : 'border-[#11161E]/20 text-[#11161E]/55';
                    return (
                      <div className={`shrink-0 border ${tone} px-4 py-2 text-center min-w-[60px]`}>
                        <div className="font-playfair text-2xl leading-none">{g || 'N/A'}</div>
                        <div className="text-[9px] tracking-[0.22em] mt-1 opacity-75">— GRADE</div>
                      </div>
                    );
                  })()}
                </div>
                <div className="text-[11px] tracking-[0.22em] text-[#11161E]/45 mb-2">— YOUR ANSWER</div>
                <p className="text-[#11161E]/85 text-[14px] leading-[1.6] whitespace-pre-wrap">
                  {s.user_answer ?? <span className="text-[#11161E]/35 italic">not answered</span>}
                </p>
                {fb && (fb.summary || fb.strengths.length > 0 || fb.weaknesses.length > 0) && (
                  <div className="mt-5">
                    <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-2">— FEEDBACK</div>
                    {fb.summary && <p className="text-[#11161E]/85 text-[14px] leading-[1.6] mb-3">{fb.summary}</p>}
                    {fb.strengths.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[10px] tracking-[0.22em] text-[#1F6F3D] mb-1">— STRENGTHS</div>
                        <ul className="list-disc list-inside text-[13px] text-[#11161E]/80 space-y-1">
                          {fb.strengths.map((s,i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {fb.weaknesses.length > 0 && (
                      <div>
                        <div className="text-[10px] tracking-[0.22em] text-[#9C2E2E] mb-1">— WEAKNESSES</div>
                        <ul className="list-disc list-inside text-[13px] text-[#11161E]/80 space-y-1">
                          {fb.weaknesses.map((w,i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {followUps.length > 0 && (
                  <div className="mt-5 border-l border-[#B88736]/40 pl-4 space-y-4">
                    <div className="text-[10px] tracking-[0.22em] text-[#B88736]">— FOLLOW-UPS</div>
                    {followUps.map(f => (
                      <div key={f.id} className="text-[13px]">
                        <p className="font-playfair italic text-[#11161E]/75 mb-1">{f.custom_question ?? f.questions?.question}</p>
                        <p className="text-[#11161E]/85 leading-[1.6] whitespace-pre-wrap">{f.user_answer ?? <span className="text-[#11161E]/35 italic">not answered</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
                </ol>
      )}
    </>
  );
}
