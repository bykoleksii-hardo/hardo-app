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
  created_at: string | null;
  time_limit_seconds: number | null;
  was_overtime: boolean | null;
  questions: Question | null;
};

type AnswerRow = {
  id: string;
  interview_step_id: string;
  user_answer: string;
  answer_type: string; // 'answer' | 'clarification' | 'clarification_response'
  created_at: string;
};

function formatMMSS(secs: number): string {
  const sign = secs < 0 ? '-' : '';
  const a = Math.abs(secs);
  const m = Math.floor(a / 60);
  const s = a % 60;
  return sign + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function QuestionTimer(props: { startedAt: string | null; limitSeconds: number; disabled?: boolean }) {
  const { startedAt, limitSeconds, disabled } = props;
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (disabled) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [disabled]);
  if (!startedAt) return null;
  const startMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startMs)) return null;
  const elapsedSec = Math.max(0, Math.floor((now - startMs) / 1000));
  const remainSec = limitSeconds - elapsedSec;
  const isOver = remainSec < 0;
  const ratio = elapsedSec / Math.max(1, limitSeconds);
  // green < 70%, gold 70-100%, red > 100%
  const color = isOver ? '#d47a7a' : ratio >= 0.7 ? '#d4a04a' : '#9ab87a';
  const label = isOver ? 'OVERTIME' : 'TIME LEFT';
  const display = isOver ? '+' + formatMMSS(elapsedSec - limitSeconds) : formatMMSS(Math.max(0, remainSec));
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className="flex items-center gap-3 text-[11px] tracking-[0.22em]" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: isOver ? '0 0 8px ' + color : 'none' }} />
      <span>{label}</span>
      <span className="font-mono text-[14px] tracking-normal" style={{ color }}>{display}</span>
      <span className="text-[#f5efe2]/30">|</span>
      <span className="text-[#f5efe2]/45 tracking-normal text-[10px]">soft limit {formatMMSS(limitSeconds)}</span>
      <div className="flex-1 h-[2px] bg-[#f5efe2]/10 rounded-full overflow-hidden ml-2 min-w-[60px]">
        <div style={{ width: pct + '%', height: '100%', background: color, transition: 'width 400ms linear' }} />
      </div>
    </div>
  );
}

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

  // Voice / STT state
  const [inputMode, setInputMode] = useState<'type' | 'voice'>('type');
  const [recState, setRecState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [recError, setRecError] = useState<string | null>(null);
  const [recElapsedSec, setRecElapsedSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recStartRef = useRef<number>(0);
  const recTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (recTickRef.current) clearInterval(recTickRef.current);
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        try { mr.stop(); } catch {}
        mr.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  async function startRecording() {
    setRecError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecError('Your browser does not support voice recording. Please type instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onerror = () => { setRecError('Recording error. Please try again.'); };
      mr.start();
      recStartRef.current = Date.now();
      setRecElapsedSec(0);
      if (recTickRef.current) clearInterval(recTickRef.current);
      recTickRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - recStartRef.current) / 1000);
        setRecElapsedSec(sec);
        // Hard safety: auto-stop at 5 minutes to avoid huge uploads.
        if (sec >= 300) stopRecording();
      }, 250);
      setRecState('recording');
    } catch (e) {
      const name = (e as { name?: string })?.name ?? '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setRecError('Microphone access denied. Allow it in your browser settings and try again, or type your answer.');
      } else {
        setRecError('Could not start recording. Please type your answer.');
      }
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    if (recTickRef.current) { clearInterval(recTickRef.current); recTickRef.current = null; }
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
      audioChunksRef.current = [];
      if (blob.size === 0) {
        setRecState('idle');
        setRecError('Empty recording. Please try again.');
        return;
      }
      setRecState('transcribing');
      try {
        if (!activeBase) throw new Error('No active question.');
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        fd.append('stepId', activeBase.id);
        const r = await fetch('/api/transcribe', { method: 'POST', body: fd });
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.friendly || data.error || 'Voice transcription failed.');
        }
        // Append (don't overwrite) so users can stitch multiple takes.
        const newPiece = String(data.text || '').trim();
        setDraft(prev => prev ? (prev.replace(/\s+$/, '') + ' ' + newPiece) : newPiece);
        setRecState('idle');
      } catch (e) {
        setRecError((e as Error).message);
        setRecState('idle');
      }
    };
    try { mr.stop(); } catch { /* ignore */ }
  }

  const activeBase = baseSteps.find(s => s.id === activeBaseId) ?? null;
  const firstPendingId = baseSteps.find(s => s.ai_status !== 'done')?.id ?? null;
  const activeQ = activeBase?.questions ?? null;
  const blockClosed = activeBase?.ai_status === 'done';

  // Timer: figure out current step (base or last unanswered FU) and its limit.
  const timerInfo = useMemo<{ startedAt: string | null; limitSeconds: number } | null>(() => {
    if (!activeBase) return null;
    const childFUs = localSteps.filter(s => s.parent_step_id === activeBase.id && s.is_follow_up).sort((a,b)=>a.order_index-b.order_index);
    const lastUnanswered = [...childFUs].reverse().find(c => !c.user_answer);
    const target = lastUnanswered ?? activeBase;
    const isFU = !!lastUnanswered;
    const cat = activeBase.questions?.category ?? '';
    const isCase = cat.toLowerCase() === 'case study';
    const limit = (target.time_limit_seconds && target.time_limit_seconds > 0)
      ? target.time_limit_seconds
      : (!isFU && isCase ? 120 : 60);
    return { startedAt: target.created_at, limitSeconds: limit };
  }, [activeBase, localSteps]);

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
          try {
            const fr = await fetch('/api/interview/finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ interviewId }),
            });
            if (!fr.ok) {
              const errBody = await fr.json().catch(() => ({}));
              throw new Error(errBody.friendly || errBody.error || 'Failed to finalize the interview. Please try again.');
            }
          } catch (e) {
            setFinalizing(false);
            setError((e as Error).message);
            return;
          }
          setFinalizing(false);
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
              const locked = !done && !active && s.id !== firstPendingId;
              const cat = s.questions?.category ?? '';
              return (
                <li key={s.id}>
                  <button
                    onClick={() => (done || active || s.id === firstPendingId) ? setActiveBaseId(s.id) : null}
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
                      <button
                        type="button"
                        onClick={() => { if (recState === 'recording') return; setInputMode('type'); }}
                        disabled={recState === 'recording' || recState === 'transcribing'}
                        className={`text-[10px] tracking-[0.22em] px-3 py-1.5 ${inputMode === 'type' ? 'bg-[#f5efe2]/10 text-[#f5efe2]' : 'text-[#f5efe2]/55 border border-[#f5efe2]/15'}`}
                      >TYPE</button>
                      <button
                        type="button"
                        onClick={() => { if (recState === 'transcribing') return; setInputMode('voice'); }}
                        disabled={recState === 'transcribing'}
                        className={`text-[10px] tracking-[0.22em] px-3 py-1.5 ${inputMode === 'voice' ? 'bg-[#d4a04a]/15 text-[#d4a04a] border border-[#d4a04a]/40' : 'text-[#f5efe2]/55 border border-[#f5efe2]/15'}`}
                      >VOICE</button>
                    </div>
                  </div>
                  {timerInfo && (
                    <div className="mb-3 -mt-2">
                      <QuestionTimer startedAt={timerInfo.startedAt} limitSeconds={timerInfo.limitSeconds} disabled={submitting || finalizing} />
                    </div>
                  )}
                  {inputMode === 'voice' && (
                    <div className="mb-3 flex items-center gap-3 px-3 py-2 border border-[#d4a04a]/25 bg-[#d4a04a]/5">
                      {recState === 'idle' && (
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={submitting || finalizing || blockClosed}
                          className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-[#d4a04a] hover:text-[#e0ae54] disabled:opacity-40"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#d4a04a]" />
                          <span>RECORD</span>
                        </button>
                      )}
                      {recState === 'recording' && (
                        <>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-[#d47a7a]"
                          >
                            <span className="w-2 h-2 rounded-sm bg-[#d47a7a] animate-pulse" />
                            <span>STOP</span>
                          </button>
                          <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55 font-mono">
                            {String(Math.floor(recElapsedSec / 60)).padStart(2, '0')}:{String(recElapsedSec % 60).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] tracking-[0.18em] text-[#f5efe2]/35">RECORDING - tap STOP when done</span>
                        </>
                      )}
                      {recState === 'transcribing' && (
                        <span className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-[#d4a04a]/80">
                          <span className="w-2 h-2 rounded-full bg-[#d4a04a]/60 animate-pulse" />
                          <span>TRANSCRIBING...</span>
                        </span>
                      )}
                      {recError && (
                        <span className="ml-auto text-[11px] text-[#d47a7a]">{recError}</span>
                      )}
                      {recState === 'idle' && !recError && (
                        <span className="ml-auto text-[10px] tracking-[0.18em] text-[#f5efe2]/35">Edit the transcript before sending.</span>
                      )}
                    </div>
                  )}
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
                      {draft.trim().split(/\s+/).filter(Boolean).length} WORDS â Cmd/Ctrl+Enter to send
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
