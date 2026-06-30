'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import FeedbackButtons from './FeedbackButtons';
import { FeedbackPanel, RubricBars, buildRubricAxes } from './feedbackUi';

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
  questions: { id?: number; question: string; category: string; subtopic: string | null } | null;
};

type AnswerKey = { key_points: string[] | null; model_answer: string | null };

type FeedbackDetail = {
  what_worked?: string;
  what_was_missing?: string;
  how_to_improve?: string;
  model_answer_pointer?: string;
};

type RubricScores = { correctness: number; depth: number; structure: number; communication: number };

type DeliveryMetrics = {
  wpm: number;
  pace: 'slow' | 'measured' | 'brisk' | 'rushed';
  filler_count: number;
  filler_per_min: number;
  long_pauses: number;
  longest_pause_sec: number;
  hedge_count: number;
};

type ParsedFeedback = {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  detail?: FeedbackDetail | null;
  rubric?: RubricScores | null;
  rubric_kind?: 'technical' | 'fit';
  delivery?: DeliveryMetrics | null;
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

function parseFeedback(raw: string | null): { summary: string; strengths: string[]; weaknesses: string[]; detail: FeedbackDetail | null; rubric: RubricScores | null; rubricKind: 'technical' | 'fit'; delivery: DeliveryMetrics | null } | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as ParsedFeedback;
    const d = (j && typeof j === 'object' && j.detail && typeof j.detail === 'object') ? j.detail as FeedbackDetail : null;
    const r = (j && typeof j === 'object' && j.rubric && typeof j.rubric === 'object') ? j.rubric as RubricScores : null;
    const dv = (j && typeof j === 'object' && j.delivery && typeof j.delivery === 'object') ? j.delivery as DeliveryMetrics : null;
    return {
      summary: typeof j.summary === 'string' ? j.summary : '',
      strengths: Array.isArray(j.strengths) ? j.strengths : [],
      weaknesses: Array.isArray(j.weaknesses) ? j.weaknesses : [],
      detail: d,
      rubric: r,
      rubricKind: j.rubric_kind === 'fit' ? 'fit' : 'technical',
      delivery: dv,
    };
  } catch {
    return { summary: raw, strengths: [], weaknesses: [], detail: null, rubric: null, rubricKind: 'technical', delivery: null };
  }
}

function DeliveryPanel({ d }: { d: DeliveryMetrics }) {
  const paceTone = (d.pace === 'measured' || d.pace === 'brisk') ? '#1F6F3D' : '#A85A1F';
  const fillerTone = d.filler_per_min <= 3 ? '#1F6F3D' : d.filler_per_min <= 6 ? '#A85A1F' : '#9C2E2E';
  const Stat = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) => (
    <div>
      <div className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-ink/45 mb-1">{label}</div>
      <div className="font-serif text-[18px] leading-none" style={tone ? { color: tone } : undefined}>{value}</div>
      {sub ? <div className="text-[11px] text-ink/45 mt-1">{sub}</div> : null}
    </div>
  );
  return (
    <div className="mt-3 rounded-md border border-ink/10 bg-paper/50 px-4 py-3.5">
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45 mb-3">Delivery <span className="text-ink/30 normal-case tracking-normal">· voice</span></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Pace" value={String(d.wpm)} sub={`wpm · ${d.pace}`} tone={paceTone} />
        <Stat label="Fillers" value={String(d.filler_count)} sub={`${d.filler_per_min}/min`} tone={fillerTone} />
        <Stat label="Long pauses" value={String(d.long_pauses)} sub={d.longest_pause_sec ? `max ${d.longest_pause_sec}s` : 'none'} />
        <Stat label="Hedging" value={String(d.hedge_count)} sub="phrases" />
      </div>
    </div>
  );
}

type Props = {
  steps: StepRow[];
  isCompleted: boolean;
  initialFeedback?: Record<string, -1 | 1>;
  // Per-question answer keys keyed by question id. Only populated post-completion.
  answerKeys?: Record<number, AnswerKey>;
};

const ALL = '__ALL__';

export default function SummaryQuestions({ steps, isCompleted, initialFeedback, answerKeys }: Props) {
  const [cat, setCat] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const detailsRefs = useRef<Map<string, HTMLDetailsElement | null>>(new Map());

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

  const mainSteps = useMemo(() => steps.filter((s) => !s.is_follow_up), [steps]);

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

  const allFilteredIds = useMemo(() => filteredSteps.map(s => s.id), [filteredSteps]);
  const allOpen = allFilteredIds.length > 0 && allFilteredIds.every(id => openIds.has(id));
  const anyOpen = allFilteredIds.some(id => openIds.has(id));

  function toggle(id: string, isOpen: boolean) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (isOpen) next.add(id); else next.delete(id);
      return next;
    });
  }

  function expandAll() {
    setOpenIds(new Set(allFilteredIds));
  }

  function collapseAll() {
    setOpenIds(new Set());
  }

  // Keep <details> open state in sync with React state (controlled-ish behavior)
  useEffect(() => {
    for (const [id, el] of detailsRefs.current.entries()) {
      if (!el) continue;
      const shouldOpen = openIds.has(id);
      if (el.open !== shouldOpen) el.open = shouldOpen;
    }
  }, [openIds]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h2 className="font-serif text-2xl">Question by question</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {filteredSteps.length > 0 && (
            <button
              type="button"
              onClick={() => (allOpen ? collapseAll() : expandAll())}
              className="text-[11px] tracking-[0.22em] text-ink/55 hover:text-gold underline-offset-4 hover:underline"
            >
              {allOpen ? 'COLLAPSE ALL' : 'EXPAND ALL'}
            </button>
          )}
          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] tracking-[0.22em] text-ink/45">FILTER</span>
              {categories.length > 1 && (
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  aria-label="Filter by category"
                  className="text-[12px] bg-transparent border border-ink/20 px-2 py-1 hover:border-gold focus:outline-none focus:border-gold"
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
                  className="text-[12px] bg-transparent border border-ink/20 px-2 py-1 hover:border-gold focus:outline-none focus:border-gold"
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
                  className="text-[11px] tracking-[0.22em] text-ink/55 hover:text-gold underline-offset-4 hover:underline"
                >
                  CLEAR
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {filteredSteps.length === 0 ? (
        <div className="border border-dashed border-ink/20 bg-cream/30 p-8 text-center">
          <div className="text-[11px] tracking-[0.22em] text-ink/55 mb-2">— NO MATCHES</div>
          <p className="text-ink/65 text-[14px] mb-4">
            No questions match these filters.
          </p>
          <button
            type="button"
            onClick={() => { setCat(ALL); setGrade(ALL); }}
            className="text-[11px] tracking-[0.22em] border border-ink/20 px-4 py-2 hover:text-gold hover:border-gold"
          >
            CLEAR FILTERS
          </button>
        </div>
      ) : (
        <ol className="space-y-3">

          {filteredSteps.map((s) => {
            const followUps = followUpsByParent.get(s.id) ?? [];
            const fb = parseFeedback(s.ai_feedback);
            const qGrade = s.ai_grade ?? s.ai_score;
            const p = formatPace(s);
            const g = (qGrade ?? '').toString().trim();
            const tone = !g ? 'border-ink/20 text-ink/55'
              : g.startsWith('A') ? 'border-[#1F6F3D]/40 text-[#1F6F3D] bg-[#1F6F3D]/8'
              : g.startsWith('B') ? 'border-[#3F7A4A]/40 text-[#3F7A4A] bg-[#3F7A4A]/8'
              : g.startsWith('C') ? 'border-[#A85A1F]/40 text-[#A85A1F] bg-[#A85A1F]/8'
              : g === 'D' ? 'border-[#9C2E2E]/40 text-[#9C2E2E] bg-[#9C2E2E]/8'
              : g === 'F' ? 'border-[#7A1F1F]/50 text-[#7A1F1F] bg-[#7A1F1F]/10'
              : 'border-ink/20 text-ink/55';
            const followUpCount = followUps.length;
            const isOpen = openIds.has(s.id);
            return (
              <li key={s.id}>
                <details
                  ref={(el) => { detailsRefs.current.set(s.id, el); }}
                  open={isOpen}
                  onToggle={(e) => toggle(s.id, (e.currentTarget as HTMLDetailsElement).open)}
                  className="group border border-ink/10 bg-cream/30 hover:border-gold/40 hover:shadow-[0_18px_40px_-30px_rgba(14,30,54,0.22)] transition-all duration-300"
                >
                  <summary className="list-none cursor-pointer p-5 flex items-start gap-4 select-none">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] tracking-[0.22em] text-ink/55 mb-2 flex items-center gap-3 flex-wrap">
                        <span>Q{String(s.order_index).padStart(2,'0')}{' · '}{(s.questions?.category ?? '').toUpperCase()}</span>
                        {p && (
                          <span className={p.over ? 'text-[#9C2E2E]' : 'text-[#3F7A4A]'}>{p.over ? 'OVERTIME ' : ''}{p.text}</span>
                        )}
                        {followUpCount > 0 && (
                          <span className="text-gold">{followUpCount} FOLLOW-UP{followUpCount === 1 ? '' : 'S'}</span>
                        )}
                      </div>
                      <p className="font-serif text-[17px] leading-[1.45] text-ink line-clamp-2 group-open:line-clamp-none">{s.questions?.question}</p>
                    </div>
                    <div className={`shrink-0 border ${tone} px-3 py-1.5 text-center min-w-[52px]`}>
                      <div className="font-serif text-xl leading-none">{g || 'N/A'}</div>
                      <div className="text-[8.5px] tracking-[0.22em] mt-1 opacity-75">GRADE</div>
                    </div>
                    <div className="shrink-0 text-ink/40 text-[18px] leading-none mt-1.5 transition-transform group-open:rotate-90" aria-hidden="true">›</div>
                  </summary>

                  <div className="px-5 pb-5">
                    <div className="mt-4 border-l-2 border-gold/60 bg-ink/[0.03] pl-4 pr-3 py-3">
                      <div className="text-[10px] tracking-[0.22em] text-gold/90 mb-2">— TRANSCRIPT</div>
                      <p className="text-ink/85 text-[14px] leading-[1.65] whitespace-pre-wrap italic">
                        {s.user_answer ?? <span className="text-ink/35 not-italic">not answered</span>}
                      </p>
                    </div>
                    {fb && fb.summary && (
                      <div className="mt-5">
                        <div className="text-[11px] tracking-[0.22em] text-gold mb-2">— FEEDBACK</div>
                        <p className="font-serif text-[15.5px] leading-[1.6] text-ink">{fb.summary}</p>
                      </div>
                    )}
                    {(() => {
                      const axes = fb ? buildRubricAxes(fb.rubric as unknown as Record<string, number> | null, fb.rubricKind) : null;
                      return axes ? (
                        <div className="mt-4 rounded-md border border-ink/10 bg-paper/50 px-4 py-3.5">
                          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45 mb-3">Score breakdown</div>
                          <RubricBars axes={axes} />
                        </div>
                      ) : null;
                    })()}
                    {fb && fb.delivery && <DeliveryPanel d={fb.delivery} />}
                    {fb && (fb.strengths.length > 0 || fb.weaknesses.length > 0) && (
                      <div className="mt-4 grid md:grid-cols-2 gap-3">
                        {fb.strengths.length > 0 && (
                          <FeedbackPanel tone="pos" label="What went well" items={fb.strengths} />
                        )}
                        {fb.weaknesses.length > 0 && (
                          <FeedbackPanel tone="neg" label="What to fix" items={fb.weaknesses} />
                        )}
                      </div>
                    )}
                    {fb && fb.detail && fb.detail.how_to_improve && (
                      <div className="mt-3 border border-gold/30 bg-gold/[0.05] rounded-md px-4 py-3">
                        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-1.5">Practice</div>
                        <p className="text-ink/85 text-[13.5px] leading-[1.6]">{fb.detail.how_to_improve}</p>
                      </div>
                    )}
                    {followUps.length > 0 && (
                      <div className="mt-5 border-l border-gold/40 pl-4 space-y-4">
                        <div className="text-[10px] tracking-[0.22em] text-gold">— FOLLOW-UPS</div>
                        {followUps.map(f => (
                          <div key={f.id} className="text-[13px]">
                            <p className="font-serif italic text-ink/75 mb-1">{(f.custom_question?.trim() || f.questions?.question?.trim()) ?? 'Follow-up question'}</p>
                            <p className="text-ink/85 leading-[1.6] whitespace-pre-wrap">{f.user_answer ?? <span className="text-ink/35 italic">not answered</span>}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {isCompleted && (() => {
                      const ak = s.questions?.id != null ? answerKeys?.[s.questions.id] : undefined;
                      if (!ak || (!ak.key_points?.length && !ak.model_answer)) return null;
                      return (
                        <div className="mt-5 border border-gold/30 bg-gold/[0.04] rounded-md px-4 py-4">
                          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-3">Answer key</div>
                          {ak.key_points && ak.key_points.length > 0 && (
                            <div className={ak.model_answer ? 'mb-4' : ''}>
                              <div className="text-[11px] tracking-[0.22em] text-ink/55 mb-2">— WHAT A STRONG ANSWER COVERS</div>
                              <ul className="space-y-1.5">
                                {ak.key_points.map((k, i) => (
                                  <li key={i} className="flex gap-2 text-[13.5px] leading-[1.55] text-ink/85">
                                    <span className="text-gold/70 shrink-0" aria-hidden="true">•</span>
                                    <span>{k}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {ak.model_answer && (
                            <div>
                              <div className="text-[11px] tracking-[0.22em] text-ink/55 mb-2">— MODEL ANSWER</div>
                              <p className="font-serif text-[14.5px] leading-[1.7] text-ink/85 whitespace-pre-wrap">{ak.model_answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {isCompleted && (
                      <div className="mt-5 pt-4 border-t border-ink/10 flex items-center justify-end">
                        <FeedbackButtons stepId={s.id} initialRating={initialFeedback?.[s.id] ?? 0} />
                      </div>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
