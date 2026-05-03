'use client';
import Brand from '@/app/_components/Brand';
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
  const color = isOver ? '#d47a7a' : ratio >= 0.7 ? '#B88736' : '#9ab87a';
  const label = isOver ? 'OVERTIME' : 'TIME LEFT';
  const display = isOver ? '+' + formatMMSS(elapsedSec - limitSeconds) : formatMMSS(Math.max(0, remainSec));
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className="flex items-center gap-3 text-[11px] tracking-[0.22em]" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: isOver ? '0 0 8px ' + color : 'none' }} />
      <span>{label}</span>
      <span className="font-mono text-[14px] tracking-normal" style={{ color }}>{display}</span>
      <span className="text-[#11161E]/30">|</span>
      <span className="text-[#11161E]/45 tracking-normal text-[10px]">soft limit {formatMMSS(limitSeconds)}</span>
      <div className="flex-1 h-[2px] bg-[#11161E]/10 rounded-full overflow-hidden ml-2 min-w-[60px]">
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
  inputMode: 'text' | 'voice';
  steps: StepRow[];
  answers: AnswerRow[];
};

const CATEGORY_COLORS: Record<string, string> = {
  'M&A': '#B88736',
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
  if (!cat) return '#11161E';
  return CATEGORY_COLORS[cat] ?? '#11161E';
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

export default function InterviewClient({ interviewId, level, totalQuestions, inputMode, steps, answers }: Props) {
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

  // Voice / STT state (mode is fixed at interview start; user cannot toggle mid-interview)
  const [recState, setRecState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [recError, setRecError] = useState<string | null>(null);
  const [recElapsedSec, setRecElapsedSec] = useState(0);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recStartRef = useRef<number>(0);
  const recTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Persistent mic stream so we don't re-prompt every round.
  const persistentStreamRef = useRef<MediaStream | null>(null);
  // Round phases: 'answering' (timer running), 'review' (timer frozen, 10s edit), 'locked' (read-only, Send only).
  const [roundPhase, setRoundPhase] = useState<Record<string, 'answering' | 'review' | 'locked'>>({});
  const [reviewStartedAt, setReviewStartedAt] = useState<Record<string, number>>({});
  const REVIEW_SECONDS = 10;
  const autoStopArmedRef = useRef<Record<string, boolean>>({});
  const autoRecordArmedRef = useRef<Record<string, boolean>>({});

  // Ask for mic permission once at interview start (voice mode only).
  useEffect(() => {
    if (inputMode !== 'voice') return;
    if (micPermission !== 'unknown') return;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (!cancelled) setMicPermission('denied');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        persistentStreamRef.current = stream;
        setMicPermission('granted');
      } catch {
        if (!cancelled) setMicPermission('denied');
      }
    })();
    return () => { cancelled = true; };
  }, [inputMode, micPermission]);

  useEffect(() => {
    return () => {
      if (recTickRef.current) clearInterval(recTickRef.current);
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        try { mr.stop(); } catch {}
      }
      const ps = persistentStreamRef.current;
      if (ps) ps.getTracks().forEach(t => t.stop());
      persistentStreamRef.current = null;
    };
  }, []);

  async function ensureStream(): Promise<MediaStream | null> {
    if (persistentStreamRef.current) {
      // Verify tracks are still live
      const tracks = persistentStreamRef.current.getTracks();
      if (tracks.length > 0 && tracks.every(t => t.readyState === 'live')) {
        return persistentStreamRef.current;
      }
      // Tracks died, drop and re-acquire
      tracks.forEach(t => t.stop());
      persistentStreamRef.current = null;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      persistentStreamRef.current = stream;
      setMicPermission('granted');
      return stream;
    } catch {
      setMicPermission('denied');
      return null;
    }
  }

  async function startRecording() {
    setRecError(null);
    const stream = await ensureStream();
    if (!stream) {
      setRecError('Microphone access denied. Allow it in your browser settings, or refresh and try again.');
      return;
    }
    try {
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
    } catch {
      setRecError('Could not start recording. Please refresh and try again.');
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    if (recTickRef.current) { clearInterval(recTickRef.current); recTickRef.current = null; }
    // Pressing STOP recording = lock answer: freeze main timer immediately, enter REVIEW phase.
    if (roundKey) {
      setRoundPhase(prev => prev[roundKey] === 'review' || prev[roundKey] === 'locked' ? prev : { ...prev, [roundKey]: 'review' });
      setReviewStartedAt(prev => prev[roundKey] ? prev : { ...prev, [roundKey]: Date.now() });
    }
    mr.onstop = async () => {
      // Don't stop the underlying mic stream; we keep it for the next round.
      const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
      audioChunksRef.current = [];
      if (blob.size === 0) {
        setRecState('idle');
        setRecError('Empty recording. Please re-record.');
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
        const newPiece = String(data.text || '').trim();
        setDraft(prev => prev ? (prev.replace(/\s+$/, '') + ' ' + newPiece) : newPiece);
        // Reset 10s review window so user has the full 10s starting NOW (when text actually appears).
        if (roundKey) {
          setReviewStartedAt(prev => ({ ...prev, [roundKey]: Date.now() }));
        }
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

  // Identify the active "round" target (base step or last unanswered follow-up).
  const roundTarget = useMemo<{ stepId: string; startedAt: string | null; limitSeconds: number } | null>(() => {
    if (!activeBase) return null;
    const childFUs = localSteps.filter(s => s.parent_step_id === activeBase.id && s.is_follow_up).sort((a,b)=>a.order_index-b.order_index);
    const lastUnanswered = [...childFUs].reverse().find(c => !c.user_answer);
    const target = lastUnanswered ?? activeBase;
    const isFU = !!lastUnanswered;
    const cat = activeBase.questions?.category ?? '';
    const isCase = cat.toLowerCase() === 'case study';
    // Voice mode: 60s default / 120s case base. Text mode: 120s default / 180s case base. Follow-ups same as default.
    const fallbackLimit = inputMode === 'voice' ? (!isFU && isCase ? 120 : 60) : (!isFU && isCase ? 180 : 120);
    const limit = (target.time_limit_seconds && target.time_limit_seconds > 0)
      ? target.time_limit_seconds
      : fallbackLimit;
    return { stepId: target.id, startedAt: target.created_at, limitSeconds: limit };
  }, [activeBase, localSteps, inputMode]);

  // Prep phase: 10s "GET READY" before each round (base + follow-ups + clarifications retries).
  // Read-only, no REC, no Send, main timer paused. Cannot be skipped.
  const PREP_SECONDS = 10;
  const [prepDoneAt, setPrepDoneAt] = useState<Record<string, number>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const prepStartRef = useRef<Record<string, number>>({});

  const roundKey = roundTarget?.stepId ?? null;
  // When a new round becomes active, stamp its prep start time once.
  useEffect(() => {
    if (!roundKey) return;
    if (prepStartRef.current[roundKey] == null) {
      prepStartRef.current[roundKey] = Date.now();
      setNowMs(Date.now());
    }
  }, [roundKey]);

  const prepActive = useMemo(() => {
    if (!roundKey) return false;
    if (prepDoneAt[roundKey]) return false;
    const startedAt = prepStartRef.current[roundKey];
    if (!startedAt) return true;
    return (nowMs - startedAt) / 1000 < PREP_SECONDS;
  }, [roundKey, prepDoneAt, nowMs]);

  const prepRemainSec = useMemo(() => {
    if (!roundKey || !prepActive) return 0;
    const startedAt = prepStartRef.current[roundKey] ?? nowMs;
    const elapsed = (nowMs - startedAt) / 1000;
    return Math.max(0, Math.ceil(PREP_SECONDS - elapsed));
  }, [roundKey, prepActive, nowMs]);

  // Tick during prep so countdown updates and we can flip prepDoneAt at the end.
  useEffect(() => {
    if (!prepActive) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [prepActive]);

  useEffect(() => {
    if (!roundKey) return;
    if (prepDoneAt[roundKey]) return;
    const startedAt = prepStartRef.current[roundKey];
    if (!startedAt) return;
    if ((nowMs - startedAt) / 1000 >= PREP_SECONDS) {
      setPrepDoneAt(prev => prev[roundKey] ? prev : { ...prev, [roundKey]: Date.now() });
    }
  }, [roundKey, nowMs, prepDoneAt]);

  // Auto-start recording in voice mode the moment prep ends (mic permission permitting).
  useEffect(() => {
    if (inputMode !== 'voice') return;
    if (!roundKey) return;
    if (prepActive) return;
    if (recState !== 'idle') return;
    const phase = roundPhase[roundKey] ?? 'answering';
    if (phase !== 'answering') return;
    if (autoRecordArmedRef.current[roundKey]) return;
    autoRecordArmedRef.current[roundKey] = true;
    void startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, prepActive, recState, roundPhase, inputMode]);

  // Lock answer (text mode "Done" button or auto-stop at hard timer overrun).
  function lockAnswerForReview() {
    if (!roundKey) return;
    setRoundPhase(prev => prev[roundKey] === 'review' || prev[roundKey] === 'locked' ? prev : { ...prev, [roundKey]: 'review' });
    setReviewStartedAt(prev => prev[roundKey] ? prev : { ...prev, [roundKey]: Date.now() });
  }

  // Review countdown: tick + auto-promote to 'locked' after REVIEW_SECONDS.
  const reviewActive = !!(roundKey && roundPhase[roundKey] === 'review');
  const reviewRemainSec = useMemo(() => {
    if (!reviewActive || !roundKey) return 0;
    const startedAt = reviewStartedAt[roundKey];
    if (!startedAt) return REVIEW_SECONDS;
    const elapsed = (nowMs - startedAt) / 1000;
    // While transcription is still pending, freeze the visible countdown at REVIEW_SECONDS.
    if (recState === 'transcribing') return REVIEW_SECONDS;
    return Math.max(0, Math.ceil(REVIEW_SECONDS - elapsed));
  }, [reviewActive, roundKey, reviewStartedAt, nowMs, recState]);

  useEffect(() => {
    if (!reviewActive) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [reviewActive]);

  useEffect(() => {
    if (!reviewActive || !roundKey) return;
    if (recState === 'transcribing') return;
    const startedAt = reviewStartedAt[roundKey];
    if (!startedAt) return;
    if ((nowMs - startedAt) / 1000 >= REVIEW_SECONDS) {
      setRoundPhase(prev => prev[roundKey] === 'locked' ? prev : { ...prev, [roundKey]: 'locked' });
    }
  }, [reviewActive, roundKey, reviewStartedAt, nowMs, recState]);

  // Timer info (server start vs prep-done start: whichever is later).
  // Timer info (server start vs prep-done start: whichever is later).
  const timerInfo = useMemo<{ startedAt: string | null; limitSeconds: number } | null>(() => {
    if (!roundTarget) return null;
    const serverStart = roundTarget.startedAt ? new Date(roundTarget.startedAt).getTime() : 0;
    const prepEnd = prepDoneAt[roundTarget.stepId];
    let effectiveMs = serverStart;
    if (prepEnd && prepEnd > serverStart) effectiveMs = prepEnd;
    const startedAtIso = effectiveMs ? new Date(effectiveMs).toISOString() : roundTarget.startedAt;
    return { startedAt: startedAtIso, limitSeconds: roundTarget.limitSeconds };
  }, [roundTarget, prepDoneAt]);

  // Hard safety: if main timer goes 30s into overtime and user hasn't stopped, auto-lock.
  useEffect(() => {
    if (!roundKey) return;
    if (prepActive) return;
    const phase = roundPhase[roundKey] ?? 'answering';
    if (phase !== 'answering') return;
    if (autoStopArmedRef.current[roundKey]) return;
    if (!timerInfo || !timerInfo.startedAt) return;
    const startMs = new Date(timerInfo.startedAt).getTime();
    if (!Number.isFinite(startMs)) return;
    const elapsedSec = (nowMs - startMs) / 1000;
    if (elapsedSec > timerInfo.limitSeconds + 30) {
      autoStopArmedRef.current[roundKey] = true;
      if (inputMode === 'voice' && recState === 'recording') {
        stopRecording();
      } else {
        lockAnswerForReview();
      }
    }
  }, [roundKey, prepActive, roundPhase, timerInfo, nowMs, inputMode, recState]);

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

      // If the model just clarified (no advance), unlock the same round so the candidate can answer.
      if (data.kind === 'clarification_response' && roundKey) {
        setRoundPhase(prev => ({ ...prev, [roundKey]: 'answering' }));
        setReviewStartedAt(prev => { const next = { ...prev }; delete next[roundKey]; return next; });
        autoRecordArmedRef.current[roundKey] = false;
        autoStopArmedRef.current[roundKey] = false;
      }

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
    <div className="min-h-screen bg-[#FBF7EE] text-[#11161E] font-inter flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#11161E]/10">
        <div className="flex items-center gap-6">
          <Brand size="md" href="/" />
          <span className="text-[11px] tracking-[0.22em] text-[#11161E]/45">
            SESSIONS / {level.toUpperCase()} / Q{String(answeredCount + 1).padStart(2, '0')}
            {activeQ ? ' - ' + activeQ.category.toUpperCase() : ''}
          </span>
        </div>
        <button
          onClick={handleEndSession}
          disabled={endingSession}
          className="text-[11px] tracking-[0.22em] text-[#11161E]/70 hover:text-[#B88736] border border-[#11161E]/20 px-4 py-2"
        >
          {endingSession ? 'ENDING...' : 'END SESSION'}
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-80 border-r border-[#11161E]/10 px-6 py-6 overflow-y-auto">
          <div className="text-[10px] tracking-[0.22em] text-[#11161E]/45 mb-1">THE ROOM</div>
          <div className="text-[10px] tracking-[0.22em] text-[#B88736] mb-6">{level.toUpperCase()} INTERVIEW</div>
          <div className="text-[10px] tracking-[0.22em] text-[#11161E]/45 mb-3 flex items-center justify-between">
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
                    className={`w-full text-left flex items-center gap-2 px-2 py-2 text-[12px] ${active ? 'bg-[#B88736]/10 border-l-2 border-[#B88736]' : ''}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(cat) }} />
                    <span className={`flex-1 ${locked ? 'text-[#11161E]/35' : 'text-[#11161E]/85'}`}>
                      {shortLabel(s.questions, s.order_index)}
                    </span>
                    {done && <span className="text-[10px] tracking-[0.18em] text-[#9ab87a]">DONE</span>}
                    {active && !done && <span className="text-[10px] tracking-[0.18em] text-[#B88736]">NOW</span>}
                    {locked && <span className="text-[10px] text-[#11161E]/30">LOCKED</span>}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="text-[10px] tracking-[0.18em] text-[#11161E]/35 mt-6">Grades are revealed at the end.</p>
        </aside>

        <main className="flex-1 flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-12 py-10">
            <div className="max-w-3xl mx-auto">
              {activeBase && activeQ && (
                <div className="flex items-center gap-3 text-[11px] tracking-[0.22em] text-[#11161E]/55 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorFor(activeQ.category) }} />
                  <span>{activeQ.category.toUpperCase()}</span>
                  <span className="text-[#11161E]/30">|</span>
                  <span>QUESTION {String(activeBase.order_index).padStart(2, '0')} / {totalQuestions} - {blockClosed ? 'COMPLETED' : 'IN PROGRESS'}</span>
                </div>
              )}

              <div className="space-y-5">
                {transcript.map((m, i) => {
                  if (m.role === 'ai' && m.kind === 'question') {
                    return (
                      <div key={i}>
                        <div className="text-[10px] tracking-[0.22em] text-[#B88736] mb-2">INTERVIEWER</div>
                        <h2 className="font-playfair text-3xl leading-[1.35]">{m.text}</h2>
                      </div>
                    );
                  }
                  if (m.role === 'ai' && m.kind === 'follow_up') {
                    return (
                      <div key={i} className="border-l-2 border-[#B88736]/50 pl-5">
                        <div className="text-[10px] tracking-[0.22em] text-[#B88736]/80 mb-1">FOLLOW-UP</div>
                        <p className="font-playfair italic text-xl text-[#11161E]/95">{m.text}</p>
                      </div>
                    );
                  }
                  if (m.role === 'ai' && m.kind === 'clarification_response') {
                    return (
                      <div key={i} className="text-[12px] italic text-[#11161E]/55">
                        Interviewer (clarification): {m.text}
                      </div>
                    );
                  }
                  if (m.role === 'ai' && m.kind === 'close_block') {
                    return (
                      <div key={i} className="border border-[#9ab87a]/30 bg-[#9ab87a]/5 px-4 py-3">
                        <div className="text-[10px] tracking-[0.22em] text-[#9ab87a]/80 mb-1">BLOCK CLOSED</div>
                        <p className="text-[14px] text-[#11161E]/85">{m.text}</p>
                      </div>
                    );
                  }
                  if (m.role === 'candidate' && m.kind === 'answer') {
                    return (
                      <div key={i} className="bg-[#F2ECDF]/60 border border-[#11161E]/10 px-4 py-3">
                        <div className="text-[10px] tracking-[0.22em] text-[#11161E]/45 mb-1">YOU</div>
                        <p className="text-[15px] text-[#11161E] whitespace-pre-wrap leading-[1.55]">{m.text}</p>
                      </div>
                    );
                  }
                  // candidate clarification
                  return (
                    <div key={i} className="text-[12px] italic text-[#11161E]/55">
                      You (clarification): {m.text}
                    </div>
                  );
                })}
              </div>

              {!blockClosed && activeBase && (
                <div className="mt-10 border border-[#11161E]/15 bg-[#F2ECDF]/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] text-[#11161E]/55">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B88736] animate-pulse" />
                      <span>YOUR REPLY</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] tracking-[0.22em] px-3 py-1.5 border ${inputMode === 'voice' ? 'border-[#B88736]/40 text-[#B88736] bg-[#B88736]/10' : 'border-[#11161E]/15 text-[#11161E]/85 bg-[#11161E]/10'}`}>
                        {inputMode === 'voice' ? 'VOICE MODE' : 'TEXT MODE'}
                      </span>
                    </div>
                  </div>
                  {prepActive ? (
                    <div className="mb-3 -mt-2 flex items-center gap-3 text-[11px] tracking-[0.22em]" style={{ color: '#B88736' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B88736] animate-pulse" />
                      <span>GET READY</span>
                      <span className="font-mono text-[14px] tracking-normal text-[#B88736]">00:{String(prepRemainSec).padStart(2, '0')}</span>
                      <span className="text-[#11161E]/30">|</span>
                      <span className="text-[#11161E]/45 tracking-normal text-[10px]">read the question, then start</span>
                      <div className="flex-1 h-[2px] bg-[#11161E]/10 rounded-full overflow-hidden ml-2 min-w-[60px]">
                        <div style={{ width: ((PREP_SECONDS - prepRemainSec) / PREP_SECONDS) * 100 + '%', height: '100%', background: '#B88736', transition: 'width 250ms linear' }} />
                      </div>
                    </div>
                  ) : reviewActive ? (
                    <div className="mb-3 -mt-2 flex items-center gap-3 text-[11px] tracking-[0.22em]" style={{ color: '#9ab87a' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9ab87a] animate-pulse" />
                      <span>REVIEW</span>
                      <span className="font-mono text-[14px] tracking-normal text-[#9ab87a]">00:{String(reviewRemainSec).padStart(2, '0')}</span>
                      <span className="text-[#11161E]/30">|</span>
                      <span className="text-[#11161E]/45 tracking-normal text-[10px]">{recState === 'transcribing' ? 'transcribing your answer...' : 'edit, then it locks'}</span>
                      <div className="flex-1 h-[2px] bg-[#11161E]/10 rounded-full overflow-hidden ml-2 min-w-[60px]">
                        <div style={{ width: ((REVIEW_SECONDS - reviewRemainSec) / REVIEW_SECONDS) * 100 + '%', height: '100%', background: '#9ab87a', transition: 'width 250ms linear' }} />
                      </div>
                    </div>
                  ) : (roundKey && roundPhase[roundKey] === 'locked') ? (
                    <div className="mb-3 -mt-2 flex items-center gap-3 text-[11px] tracking-[0.22em] text-[#11161E]/55">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#11161E]/55" />
                      <span>LOCKED</span>
                      <span className="text-[#11161E]/30">|</span>
                      <span className="text-[#11161E]/45 tracking-normal text-[10px]">answer is final - hit Send when ready</span>
                    </div>
                  ) : timerInfo && (
                    <div className="mb-3 -mt-2">
                      <QuestionTimer startedAt={timerInfo.startedAt} limitSeconds={timerInfo.limitSeconds} disabled={submitting || finalizing || reviewActive} />
                    </div>
                  )}
                  {inputMode === 'voice' && !(roundKey && roundPhase[roundKey] === 'locked') && (
                    <div className="mb-3 flex items-center gap-3 px-3 py-2 border border-[#B88736]/25 bg-[#B88736]/5">
                      {recState === 'idle' && (
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={submitting || finalizing || blockClosed || prepActive || (!!roundKey && roundPhase[roundKey] !== 'answering')}
                          className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-[#B88736] hover:text-[#B88736] disabled:opacity-40"
                          title={prepActive ? 'Wait for the prep timer to finish' : ''}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#B88736]" />
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
                          <span className="text-[11px] tracking-[0.18em] text-[#11161E]/55 font-mono">
                            {String(Math.floor(recElapsedSec / 60)).padStart(2, '0')}:{String(recElapsedSec % 60).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] tracking-[0.18em] text-[#11161E]/35">RECORDING - tap STOP when done</span>
                        </>
                      )}
                      {recState === 'transcribing' && (
                        <span className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-[#B88736]/80">
                          <span className="w-2 h-2 rounded-full bg-[#B88736]/60 animate-pulse" />
                          <span>TRANSCRIBING...</span>
                        </span>
                      )}
                      {recError && (
                        <span className="ml-auto text-[11px] text-[#d47a7a]">{recError}</span>
                      )}
                      {recState === 'idle' && !recError && (
                        <span className="ml-auto text-[10px] tracking-[0.18em] text-[#11161E]/35">Edit the transcript before sending.</span>
                      )}
                    </div>
                  )}
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    readOnly={prepActive || (!!roundKey && roundPhase[roundKey] === 'locked')}
                    placeholder={prepActive ? 'Read the question. Typing unlocks once prep ends.' : ((!!roundKey && roundPhase[roundKey] === 'locked') ? 'Answer is locked. Hit Send.' : (reviewActive ? 'Final 10 seconds to edit your answer.' : 'Answer, or ask the interviewer to clarify...'))}
                    rows={6}
                    className={'w-full bg-transparent border-0 outline-none resize-none text-[#11161E] placeholder:text-[#11161E]/30 font-inter text-[15px] leading-[1.6] ' + ((prepActive || (!!roundKey && roundPhase[roundKey] === 'locked')) ? 'opacity-50 cursor-not-allowed' : '')}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !prepActive && !!roundKey && roundPhase[roundKey] === 'locked') handleSubmit();
                    }}
                  />
                  {error && <div className="text-[12px] text-[#d47a7a] mt-2">{error}</div>}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#11161E]/10">
                    <span className="text-[11px] tracking-[0.18em] text-[#11161E]/45">
                      {draft.trim().split(/\s+/).filter(Boolean).length} WORDS{(roundKey && roundPhase[roundKey] === 'locked') ? ' - Cmd/Ctrl+Enter to send' : ''}
                    </span>
                    {(() => {
                      const phase: 'answering' | 'review' | 'locked' = roundKey ? (roundPhase[roundKey] ?? 'answering') : 'answering';
                      if (prepActive) {
                        return (
                          <button disabled className="bg-[#B88736] text-[#FBF7EE] font-medium tracking-wide px-6 py-2.5 opacity-40">Get ready...</button>
                        );
                      }
                      if (submitting || finalizing) {
                        return (
                          <button disabled className="bg-[#B88736] text-[#FBF7EE] font-medium tracking-wide px-6 py-2.5 opacity-40">{submitting ? 'Thinking...' : 'Finalizing...'}</button>
                        );
                      }
                      if (phase === 'review') {
                        return (
                          <button disabled className="bg-[#9ab87a] text-[#FBF7EE] font-medium tracking-wide px-6 py-2.5 opacity-60">
                            {recState === 'transcribing' ? 'Transcribing...' : 'Reviewing 00:' + String(reviewRemainSec).padStart(2, '0')}
                          </button>
                        );
                      }
                      if (phase === 'locked') {
                        return (
                          <button
                            onClick={handleSubmit}
                            disabled={draft.trim().length < 1}
                            className="bg-[#B88736] text-[#FBF7EE] font-medium tracking-wide px-6 py-2.5 disabled:opacity-40 hover:bg-[#B88736]"
                          >
                            Send
                          </button>
                        );
                      }
                      if (inputMode === 'voice') {
                        return (
                          <span className="text-[11px] tracking-[0.18em] text-[#11161E]/55">Tap STOP above to lock your answer</span>
                        );
                      }
                      return (
                        <button
                          onClick={lockAnswerForReview}
                          disabled={draft.trim().length < 1}
                          className="bg-[#B88736] text-[#FBF7EE] font-medium tracking-wide px-6 py-2.5 disabled:opacity-40 hover:bg-[#B88736]"
                          title="Lock your answer and start a 10-second review window"
                        >
                          Done
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}

              {blockClosed && (
                <div className="mt-10 text-[12px] tracking-[0.18em] text-[#11161E]/55">
                  Block complete. Your grade will appear in the final scorecard.
                </div>
              )}

              {!activeQ && (
                <div className="text-center text-[#11161E]/55 mt-32">
                  <p className="font-playfair italic text-3xl mb-4">All questions answered.</p>
                  <a href={`/interview/${interviewId}/summary`} className="text-[#B88736] underline">View your scorecard</a>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
