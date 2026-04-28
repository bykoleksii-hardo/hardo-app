'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = { id: number; question: string; category: string; subtopic: string | null; difficulty: number };
type StepRow = {
  id: number;
  order_index: number;
  is_follow_up: boolean;
  parent_step_id: number | null;
  question_id: number | null;
  user_answer: string | null;
  answered_at: string | null;
  ai_score: string | null;
  ai_feedback: string | null;
  questions: Question | null;
};

type Props = { interviewId: string; level: string; totalQuestions: number; steps: StepRow[] };

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

function colorFor(cat: string | undefined | null) {
  if (!cat) return '#f5efe2';
  return CATEGORY_COLORS[cat] ?? '#f5efe2';
}

function shortLabel(q: Question | null, idx: number) {
  if (!q) return `Q${String(idx).padStart(2, '0')}`;
  const tail = (q.subtopic && q.subtopic.length <= 28 ? q.subtopic : null) ?? q.category;
  return `Q${String(idx).padStart(2, '0')} - ${tail}`;
}

export default function InterviewClient({ interviewId, level, totalQuestions, steps }: Props) {
  const router = useRouter();

  // Primary steps only for the sidebar (follow-ups are nested in the main panel)
  const mainSteps = useMemo(() => steps.filter(s => !s.is_follow_up).sort((a,b)=>a.order_index-b.order_index), [steps]);

  // Find the active step: first un-answered primary step (follow-ups go via inline state below)
  const initialActiveId = useMemo(() => {
    const next = mainSteps.find(s => !s.answered_at);
    return next?.id ?? mainSteps[mainSteps.length - 1]?.id ?? null;
  }, [mainSteps]);

  const [activeId, setActiveId] = useState<number | null>(initialActiveId);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);

  // local copy of steps so we can update answered status optimistically
  const [localSteps, setLocalSteps] = useState<StepRow[]>(steps);

  const activeStep = localSteps.find(s => s.id === activeId) ?? null;
  const activeQ = activeStep?.questions ?? null;
  const followUps = localSteps.filter(s => s.is_follow_up && s.parent_step_id === activeId);

  const answeredCount = localSteps.filter(s => !s.is_follow_up && s.answered_at).length;
  const startedAtLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  async function handleSubmit() {
    if (!activeStep) return;
    if (answer.trim().length < 2) { setError('Write at least a few words.'); return; }
    setError(null); setSubmitting(true);
    try {
      const r = await fetch('/api/interview/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: activeStep.id, answer: answer.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'submit failed');

      // mark current step answered locally
      setLocalSteps(prev => prev.map(s => s.id === activeStep.id ? { ...s, user_answer: answer.trim(), answered_at: new Date().toISOString() } : s));
      setAnswer('');

      if (data.done) {
        router.push(`/interview/${interviewId}/summary`);
        return;
      }
      // move to next step
      const nextId = data.next?.step_id ?? null;
      if (nextId) setActiveId(nextId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEndSession() {
    if (!confirm('End session now? Your progress will be saved as paused.')) return;
    setEndingSession(true);
    try {
      await fetch('/api/interview/pause', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      });
      router.push('/interview/setup');
    } finally { setEndingSession(false); }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#f5efe2]/10">
        <div className="flex items-center gap-6">
          <span className="font-playfair text-xl tracking-wide">HARDO</span>
          <span className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45">
            SESSIONS / {level.toUpperCase()} / Q{String(answeredCount + 1).padStart(2,'0')} - {(activeQ?.category ?? '').toUpperCase()}
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
        {/* Sidebar */}
        <aside className="w-80 border-r border-[#f5efe2]/10 px-6 py-6 overflow-y-auto">
          <div className="text-[10px] tracking-[0.22em] text-[#f5efe2]/45 mb-1">THE ROOM</div>
          <div className="text-[10px] tracking-[0.22em] text-[#d4a04a] mb-6">{level.toUpperCase()} INTERVIEW</div>

          <div className="text-[10px] tracking-[0.22em] text-[#f5efe2]/45 mb-3 flex items-center justify-between">
            <span>PROGRESS</span>
            <span>{String(answeredCount).padStart(2,'0')} / {String(totalQuestions).padStart(2,'0')}</span>
          </div>

          <ol className="space-y-1">
            {mainSteps.map((s) => {
              const done = !!s.answered_at;
              const active = s.id === activeId;
              const locked = !done && !active;
              const cat = s.questions?.category ?? '';
              return (
                <li key={s.id}>
                  <div className={`flex items-center gap-2 px-2 py-2 text-[12px] ${active ? 'bg-[#d4a04a]/10 border-l-2 border-[#d4a04a]' : ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(cat) }} />
                    <span className={`flex-1 ${locked ? 'text-[#f5efe2]/35' : 'text-[#f5efe2]/85'}`}>
                      {shortLabel(s.questions, s.order_index)}
                    </span>
                    {done && <span className="text-[10px] tracking-[0.18em] text-[#9ab87a]">DONE</span>}
                    {active && !done && <span className="text-[10px] tracking-[0.18em] text-[#d4a04a]">NOW</span>}
                    {locked && <span className="text-[10px] text-[#f5efe2]/30">LOCKED</span>}
                  </div>
                  {done && s.ai_score && (
                    <div className="ml-4 text-[10px] tracking-[0.18em] text-[#d4a04a]/80">SCORE {s.ai_score}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Center */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-12 py-10">
            <div className="max-w-3xl mx-auto">
              {activeQ && activeStep && (
                <>
                  <div className="flex items-center gap-3 text-[11px] tracking-[0.22em] text-[#f5efe2]/55 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(activeQ.category) }} />
                    <span>{activeQ.category.toUpperCase()}</span>
                    <span className="text-[#f5efe2]/30">|</span>
                    <span>QUESTION {String(activeStep.order_index).padStart(2,'0')} / {totalQuestions} - IN PROGRESS</span>
                  </div>

                  <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/45 mb-2">M  INTERVIEWER  -  {startedAtLabel}</div>
                  <h2 className="font-playfair text-3xl leading-[1.35] mb-10">
                    {activeQ.question}
                  </h2>

                  {/* Follow-ups (nested under primary) */}
                  {followUps.length > 0 && (
                    <div className="mb-10 border-l border-[#d4a04a]/40 pl-5 space-y-4">
                      <div className="text-[10px] tracking-[0.22em] text-[#d4a04a]">FOLLOWING UP</div>
                      {followUps.map(f => (
                        <div key={f.id}>
                          <p className="font-playfair italic text-lg text-[#f5efe2]/90">{f.questions?.question}</p>
                          {f.user_answer && (
                            <p className="mt-2 text-sm text-[#f5efe2]/60">Your answer: {f.user_answer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer composer */}
                  <div className="border border-[#f5efe2]/15 bg-[#0e1c33]/40 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] text-[#f5efe2]/55">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a04a] animate-pulse" />
                        <span>YOUR ANSWER  -  Q{String(activeStep.order_index).padStart(2,'0')}</span>
                      </div>
                      <div className="flex gap-1">
                        <button className="text-[10px] tracking-[0.22em] px-3 py-1.5 bg-[#f5efe2]/10 text-[#f5efe2]">TYPE</button>
                        <button disabled className="text-[10px] tracking-[0.22em] px-3 py-1.5 text-[#f5efe2]/35 border border-[#f5efe2]/15" title="Coming soon">VOICE</button>
                      </div>
                    </div>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Walk me through your answer. Take your time, structure it like the real thing..."
                      rows={7}
                      className="w-full bg-transparent border-0 outline-none resize-none text-[#f5efe2] placeholder:text-[#f5efe2]/30 font-inter text-[15px] leading-[1.6]"
                    />
                    {error && <div className="text-[12px] text-[#d47a7a] mt-2">{error}</div>}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f5efe2]/10">
                      <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/45">
                        {answer.trim().split(/\s+/).filter(Boolean).length} WORDS
                      </span>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || answer.trim().length < 2}
                        className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-wide px-6 py-2.5 disabled:opacity-40 hover:bg-[#e0ae54]"
                      >
                        {submitting ? 'Saving...' : (answeredCount + 1 >= totalQuestions ? 'Finish interview ->' : 'Submit & next ->')}
                      </button>
                    </div>
                  </div>
                </>
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
