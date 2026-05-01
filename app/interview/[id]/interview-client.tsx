'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  id: number;
  question: string;
  category: string;
  subtopic: string | null;
  difficulty: number | null;
};

type StepRow = {
  id: string;
  order_index: number;
  is_follow_up: boolean;
  parent_step_id: string | null;
  question_id: number | null;
  custom_question: string | null;
  user_answer: string | null;
  answered_at: string | null;
  ai_status: string | null;
  ai_grade: string | null;
  ai_feedback: string | null;
  questions: Question | null;
};

type AnswerRow = {
  id: string;
  interview_step_id: string;
  user_answer: string;
  answer_type: string; // 'answer' | 'clarification' | 'clarification_response'
  created_at: string;
};

type ChatMsg =
  | { role: 'ai'; kind: 'question'; text: string; stepId: string }
  | { role: 'ai'; kind: 'follow_up'; text: string; stepId: string }
  | { role: 'ai'; kind: 'clarification_response'; text: string }
  | { role: 'ai'; kind: 'close_block'; text: string }
  | { role: 'candidate'; kind: 'answer'; text: string }
  | { role: 'candidate'; kind: 'clarification'; text: string };

type Props = {
  interviewId: string;
  level: string;
  totalQuestions: number;
  steps: StepRow[];
  answers: AnswerRow[];
};

const CATEGORY_COLORS: Record<string, string> = {
  'M&A': '#d4a04a',
  'Private Equity / LBO': '#c97a4a',
  'Valuation': '#9ab87a',
  'Accounting': '#7a9ab8',
  'Corporate Finance': '#b87a9a',
  'Behavioral / Fit': '#d4c47a',
  'Case Study': '#a87ad4',
  'Due Diligence': '#7ad4c4',
  'Venture Capital': '#d47a7a',
  'Business Acumen / Markets': '#7ab8d4',
};
function colorFor(cat?: string | null) {
  if (!cat) return '#f5efe2';
  return CATEGORY_COLORS[cat] ?? '#f5efe2';
}
function shortLabel(q: Question | null, idx: number) {
  if (!q) return `Q${String(idx).padStart(2, '0')}`;
  const tail = (q.subtopic && q.subtopic.length <= 28 ? q.subtopic : null) ?? q.category;
  return `Q${String(idx).padStart(2, '0')} - ${tail}`;
}

function buildBlockTranscript(baseStep: StepRow, allSteps: StepRow[], allAnswers: AnswerRow[]): ChatMsg[] {
  const out: ChatMsg[] = [];
  if (baseStep.questions?.question) {
    out.push({ role: 'ai', kind: 'question', text: baseStep.questions.question, stepId: baseStep.id });
  }
  // Walk children in order, interleaving each step's question (if FU) and its answers chronologically.
  const orderedSteps: StepRow[] = [baseStep, ...allSteps.filter(s => s.parent_step_id === baseStep.id).sort((a, b) => a.order_index - b.order_index)];
  for (const s of orderedSteps) {
    if (s.is_follow_up && s.custom_question) {
      out.push({ role: 'ai', kind: 'follow_up', text: s.custom_question, stepId: s.id });
    }
    const ans = allAnswers.filter(a => a.interview_step_id === s.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const a of ans) {
      if (a.answer_type === 'clarification') {
        out.push({ role: 'candidate', kind: 'clarification', text: a.user_answer });
      } else if (a.answer_type === 'clarification_response') {
        out.push({ role: 'ai', kind: 'clarification_response', text: a.user_answer });
      } else {
        out.push({ role: 'candidate', kind: 'answer', text: a.user_answer });
      }
    }
  }
  // If block was graded show the close_block bubble.
  if (baseStep.ai_status === 'done' && baseStep.ai_feedback) {
    let txt = baseStep.ai_feedback;
    try {
      const j = JSON.parse(baseStep.ai_feedback);
      if (j && typeof j === 'object' && 'summary' in j) txt = j.summary as string;
    } catch {}
    out.push({ role: 'ai', kind: 'close_block', text: txt });
  }
  return out;
}

export default function InterviewClient({ interviewId, level, totalQuestions, steps, answers }: Props) {
  const router = useRouter();

  const [localSteps, setLocalSteps] = useState<StepRow[]>(steps);
  const [localAnswers, setLocalAnswers] = useState<AnswerRow[]>(answers);

  const baseSteps = useMemo(
    () => localSteps.filter(s => !s.is_follow_up).sort((a, b) => a.order_index - b.order_index),
    [localSteps]
  );

  const initialActiveId = useMemo<string | null>(() => {
    const next = baseSteps.find(s => s.ai_status !== 'done');
    return next?.id ?? baseSteps[baseSteps.length - 1]?.id ?? null;
  }, [baseSteps]);

  const [activeBaseId, setActiveBaseId] = useState<string | null>(initialActiveId);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const activeBase = baseSteps.find(s => s.id === activeBaseId) ?? null;
  const activeQ = activeBase?.questions ?? null;
  const blockClosed = activeBase?.ai_status === 'done';

  const transcript = useMemo<ChatMsg[]>(() => {
    if (!activeBase) return [];
    return buildBlockTranscript(activeBase, localSteps, localAnswers);
  }, [activeBase, localSteps, localAnswers]);

  const answeredCount = baseSteps.filter(s => s.ai_status === 'done').length;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript.length, activeBaseId]);

  function pushOptimisticCandidate(text: string) {
    // We don't know the real targeted step id yet for the answers row; we just visually echo in transcript.
    // Real persistence happens server-side; on response we re-sync state from /turn payload.
    const s = activeBase;
    if (!s) return;
    setLocalAnswers(prev => [
      ...prev,
      { id: 'tmp-' + Math.random(), interview_step_id: s.id, user_answer: text, answer_type: 'answer', created_at: new Date().toISOString() },
    ]);
  }

  async function handleSubmit() {
    if (!activeBase) return;
    if (draft.trim().length < 1) {
      setError('Write something first.');
      return;
    }
    if (blockClosed) return;
    setError(null);
    setSubmitting(true);
    const text = draft.trim();
    setDraft('');
    try {
      const r = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: activeBase.id, message: text }),
      });
      const data = await r.json();
      if (!r.ok) {
        const friendly = data.friendly || data.error || 'The interviewer is unavailable right now. Please try again later.';
        const err = new Error(friendly);
        // attach raw for debugging
        (err as any).raw = data.error;
        throw err;
      }

      // Re-fetch fresh steps + answers via a tiny refresh call (simpler than mutating in place).
      await refreshState();

      if (data.kind === 'close_block') {
        if (data.is_last) {
          // Trigger finalize and route to summary.
          setFinalizing(true);
          await fetch('/api/interview/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewId }),
          }).catch(() => {});
          router.push(`/interview/${interviewId}/summary`);
          return;
        }
        if (data.next_base_step_id) setActiveBaseId(data.next_base_step_id);
      }
    } catch (e) {
      setError((e as Error).message);
      setDraft(text); // restore draft
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshState() {
    try {
      const r = await fetch(`/api/interview/state?id=${interviewId}`, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      if (Array.isArray(j.steps)) setLocalSteps(j.steps);
      if (Array.isArray(j.answers)) setLocalAnswers(j.answers);
    } catch {}
  }

  async function handleEndSession() {
    if (!confirm('End session now? Your progress will be saved as paused.')) return;
    setEndingSession(true);
    try {
      await fetch('/api/interview/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      });
      router.push('/interview/setup');
    } finally {
      setEndingSession(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#f5efe2]/10">
        <div className="flex items-center gap-6">
          <span className="font-playfair text-xl tracking-wide">HARDO</span>
          <span className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45">
            SESSIONS / {level.toUpperCase()} / Q{String(answeredCount + 1).padStart(2, '0')}
            {activeQ ? ' - ' + activeQ.category.toUpperCase() : ''}
          </span>
        </div>
        <button
          onClick={handleEndSession}
          disabled={endingSession}
          className="text-[11px] tracking-[0.22em] text-[#f5efe2]/70 hover:text-[#d4a04a] border border-[#f5efe2]/20 px-4 py-2"
        >
          {endingSession ? 'ENDING...' : 'END SESSION'}
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-80 border-r border-[#f5efe2]/10 px-6 py-6 overflow-y-auto">
          <div className="text-[10px] tracking-[0.22em] text-[#f5efe2]/45 mb-1">THE ROOM</div>
          <div className="text-[10px] tracking-[0.22em] text-[#d4a04a] mb-6">{level.toUpperCase()} INTERVIEW</div>
          <div className="text-[10px] tracking-[0.22em] text-[#f5efe2]/45 mb-3 flex items-center justify-between">
            <span>PROGRESS</span>
            <span>{String(answeredCount).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}</span>
          </div>
          <ol className="space-y-1">
            {baseSteps.map((s) => {
              const done = s.ai_status === 'done';
              const active = s.id === activeBaseId;
              const locked = !done && !active;
              const cat = s.questions?.category ?? '';
              return (
                <li key={s.id}>
                  <button
                    onClick={() => done || active ? setActiveBaseId(s.id) : null}
                    disabled={locked}
                    className={`w-full text-left flex items-center gap-2 px-2 py-2 text-[12px] ${active ? 'bg-[#d4a04a]/10 border-l-2 border-[#d4a04a]' : ''}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(cat) }} />
                    <span className={`flex-1 ${locked ? 'text-[#f5efe2]/35' : 'text-[#f5efe2]/85'}`}>
                      {shortLabel(s.questions, s.order_index)}
                    </span>
                    {done && <span className="text-[10px] tracking-[0.18em] text-[#9ab87a]">DONE</span>}
                    {active && !done && <span className="text-[10px] tracking-[0.18em] text-[#d4a04a]">NOW</span>}
                    {locked && <span className="text-[10px] text-[#f5efe2]/30">LOCKED</span>}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="text-[10px] tracking-[0.18em] text-[#f5efe2]/35 mt-6">Grades are revealed at the end.</p>
        </aside>

        <main className="flex-1 flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-12 py-10">
            <div className="max-w-3xl mx-auto">
              {activeBase && activeQ && (
                <div className="flex items-center gap-3 text-[11px] tracking-[0.22em] text-[#f5efe2]/55 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(activeQ.category) }} />
                  <span>{activeQ.category.toUpperCase()}</span>
                  <span className="text-[#f5efe2]/30">|</span>
                  <span>QUESTION {String(activeBase.order_index).padStart(2, '0')} / {totalQuestions} - {blockClosed ? 'COMPLETED' : 'IN PROGRESS'}</span>
                </div>
              )}

              <div className="space-y-5">
                {transcript.map((m, i) => {
                  if (m.role === 'ai' && m.kind === 'question') {
                    return (
                      <div key={i}>
                        <div className="text-[10px] tracking-[0.22em] text-[#d4a04a] mb-2">INTERVIEWER</div>
                        <h2 className="font-playfair text-3xl leading-[1.35]">{m.text}</h2>
                      </div>
                    );
                  }
                  if (m.role === 'ai' && m.kind === 'follow_up') {
                    return (
                      <div key={i} className="border-l-2 border-[#d4a04a]/50 pl-5">
                        <div className="text-[10px] tracking-[0.22em] text-[#d4a04a]/80 mb-1">FOLLOW-UP</div>
                        <p className="font-playfair italic text-xl text-[#f5efe2]/95">{m.text}</p>
                      </div>
                    );
                  }
                  if (m.role === 'ai' && m.kind === 'clarification_response') {
                    return (
                      <div key={i} className="text-[12px] italic text-[#f5efe2]/55">
                        Interviewer (clarification): {m.text}
                      </div>
                    );
                  }
                  if (m.role === 'ai' && m.kind === 'close_block') {
                    return (
                      <div key={i} className="border border-[#9ab87a]/30 bg-[#9ab87a]/5 px-4 py-3">
                        <div className="text-[10px] tracking-[0.22em] text-[#9ab87a]/80 mb-1">BLOCK CLOSED</div>
                        <p className="text-[14px] text-[#f5efe2]/85">{m.text}</p>
                      </div>
                    );
                  }
                  if (m.role === 'candidate' && m.kind === 'answer') {
                    return (
                      <div key={i} className="bg-[#0e1c33]/60 border border-[#f5efe2]/10 px-4 py-3">
                        <div className="text-[10px] tracking-[0.22em] text-[#f5efe2]/45 mb-1">YOU</div>
                        <p className="text-[15px] text-[#f5efe2] whitespace-pre-wrap leading-[1.55]">{m.text}</p>
                      </div>
                    );
                  }
                  // candidate clarification
                  return (
                    <div key={i} className="text-[12px] italic text-[#f5efe2]/55">
                      You (clarification): {m.text}
                    </div>
                  );
                })}
              </div>

              {!blockClosed && activeBase && (
                <div className="mt-10 border border-[#f5efe2]/15 bg-[#0e1c33]/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] text-[#f5efe2]/55">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4a04a] animate-pulse" />
                      <span>YOUR REPLY</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="text-[10px] tracking-[0.22em] px-3 py-1.5 bg-[#f5efe2]/10 text-[#f5efe2]">TYPE</button>
                      <button disabled className="text-[10px] tracking-[0.22em] px-3 py-1.5 text-[#f5efe2]/35 border border-[#f5efe2]/15" title="Coming in v2">VOICE</button>
                    </div>
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Answer, or ask the interviewer to clarify..."
                    rows={6}
                    className="w-full bg-transparent border-0 outline-none resize-none text-[#f5efe2] placeholder:text-[#f5efe2]/30 font-inter text-[15px] leading-[1.6]"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
                    }}
                  />
                  {error && <div className="text-[12px] text-[#d47a7a] mt-2">{error}</div>}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f5efe2]/10">
                    <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/45">
                      {draft.trim().split(/\s+/).filter(Boolean).length} WORDS — Cmd/Ctrl+Enter to send
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || finalizing || draft.trim().length < 1}
                      className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-wide px-6 py-2.5 disabled:opacity-40 hover:bg-[#e0ae54]"
                    >
                      {submitting ? 'Thinking...' : finalizing ? 'Finalizing...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}

              {blockClosed && (
                <div className="mt-10 text-[12px] tracking-[0.18em] text-[#f5efe2]/55">
                  Block complete. Your grade will appear in the final scorecard.
                </div>
              )}

              {!activeQ && (
                <div className="text-center text-[#f5efe2]/55 mt-32">
                  <p className="font-playfair italic text-3xl mb-4">All questions answered.</p>
                  <a href={`/interview/${interviewId}/summary`} className="text-[#d4a04a] underline">View your scorecard</a>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
