'use client';

import { useState } from 'react';
import type { AdminQuestion, Region } from '@/lib/admin/questions';

type Level = 'intern' | 'analyst' | 'associate';
type Kind = 'clarification_response' | 'follow_up' | 'close_block';

type AIResult = {
  kind: Kind;
  message_type: 'answer' | 'clarification';
  reasoning: string;
  reply: string;
  follow_up_question: string;
  grade: '' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  feedback: string;
  feedback_detail: {
    what_worked: string;
    what_was_missing: string;
    how_to_improve: string;
    model_answer_pointer: string;
  };
  strengths: string[];
  weaknesses: string[];
};

type TranscriptEntry =
  | { role: 'candidate'; kind: 'answer' | 'clarification'; text: string }
  | { role: 'ai'; kind: 'follow_up' | 'clarification_response'; text: string };

type Turn = {
  candidateMessage: string;
  ai: AIResult | null;
  error: string | null;
};

const LEVELS: Level[] = ['intern', 'analyst', 'associate'];

export default function QuestionLab({ question }: { question: AdminQuestion }) {
  const [level, setLevel] = useState<Level>('analyst');
  const [region, setRegion] = useState<Region>(question.region);
  const [savingRegion, setSavingRegion] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  async function saveRegion(next: Region) {
    if (next === region) return;
    const prev = region;
    setRegion(next);
    setSavingRegion(true);
    setRegionError(null);
    try {
      const res = await fetch(`/api/admin/questions/${question.id}/region`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ region: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setRegionError(j.error || `HTTP ${res.status}`);
        setRegion(prev);
      }
    } catch (err) {
      setRegionError(err instanceof Error ? err.message : 'network_error');
      setRegion(prev);
    } finally {
      setSavingRegion(false);
    }
  }
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [candidateInput, setCandidateInput] = useState('');
  const [pending, setPending] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Derive the current state of the block.
  // followUpsSoFar = number of AI follow_up entries already in transcript.
  const followUpsSoFar = transcript.filter((t) => t.role === 'ai' && t.kind === 'follow_up').length;
  // Block is closed if the last AI result was close_block.
  const lastAi = turns.length > 0 ? turns[turns.length - 1].ai : null;
  const blockClosed = lastAi?.kind === 'close_block';

  async function sendTurn() {
    if (!candidateInput.trim() || pending || blockClosed) return;
    setGlobalError(null);
    setPending(true);
    const message = candidateInput.trim();
    try {
      const res = await fetch('/api/admin/question-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          category: question.category,
          subtopic: question.subtopic,
          difficulty: question.difficulty,
          level,
          transcript,
          followUpsSoFar,
          candidateMessage: message,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ai) {
        setGlobalError(json.error || `HTTP ${res.status}`);
        setPending(false);
        return;
      }
      const ai = json.ai as AIResult;
      // Append candidate entry (kind from ai.message_type), then AI entry if kind is follow_up or clarification_response.
      const candidateEntry: TranscriptEntry = {
        role: 'candidate',
        kind: ai.message_type === 'clarification' ? 'clarification' : 'answer',
        text: message,
      };
      const next: TranscriptEntry[] = [...transcript, candidateEntry];
      if (ai.kind === 'follow_up' && ai.follow_up_question) {
        next.push({ role: 'ai', kind: 'follow_up', text: ai.follow_up_question });
      } else if (ai.kind === 'clarification_response' && ai.reply) {
        next.push({ role: 'ai', kind: 'clarification_response', text: ai.reply });
      }
      setTranscript(next);
      setTurns([...turns, { candidateMessage: message, ai, error: null }]);
      setCandidateInput('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      setGlobalError(msg);
    }
    setPending(false);
  }

  function reset() {
    setTranscript([]);
    setTurns([]);
    setCandidateInput('');
    setGlobalError(null);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <div>
        {/* Question header */}
        <div className="kicker mb-2">Question Â· ID {question.id}</div>
        <h1 className="font-serif text-[28px] leading-snug font-medium mb-4">{question.question}</h1>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
          <span>{question.category}</span>
          {question.subtopic && <><span>Â·</span><span>{question.subtopic}</span></>}
          {question.difficulty !== null && <><span>Â·</span><span>Difficulty {question.difficulty}</span></>}
        </div>

        {/* Level selector */}
        <div className="mb-6">
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted mb-2">Region (admin only)</div>
                    <div className="inline-flex border border-line rounded overflow-hidden mb-6">
                      {(["US","EMEA","Global"] as const).map((rg) => (
                        <button
                          key={rg}
                          type="button"
                          onClick={() => saveRegion(rg)}
                          disabled={savingRegion}
                          className={`px-4 py-2 text-[12.5px] uppercase tracking-widest font-mono transition ${
                            region === rg ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
                          } ${savingRegion ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {rg}
                        </button>
                      ))}
                    </div>
                    {regionError && (
                      <div className="mb-4 text-[11px] text-[#c2410c] font-mono">
                        Region save failed: {regionError}
                      </div>
                    )}
                    <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted mb-2">Candidate level</div>
          <div className="inline-flex border border-line rounded overflow-hidden">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => { if (transcript.length === 0) setLevel(lv); }}
                disabled={transcript.length > 0 && lv !== level}
                className={`px-4 py-2 text-[12.5px] uppercase tracking-widest font-mono transition ${
                  level === lv ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
                } ${transcript.length > 0 && lv !== level ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {lv}
              </button>
            ))}
          </div>
          {transcript.length > 0 && (
            <div className="mt-2 text-[11px] text-muted font-mono">
              Locked once a turn is recorded. Reset to switch level.
            </div>
          )}
        </div>

        {/* Transcript so far */}
        {transcript.length > 0 && (
          <div className="mb-6 border border-line rounded p-5 bg-cream/30 space-y-4">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Transcript</div>
            {transcript.map((t, i) => (
              <div key={i} className="text-[14px] leading-relaxed">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">
                  {t.role === 'candidate'
                    ? (t.kind === 'clarification' ? 'You Â· clarification' : 'You Â· answer')
                    : (t.kind === 'follow_up' ? 'Interviewer Â· follow-up' : 'Interviewer Â· clarification reply')}
                </div>
                <div className={t.role === 'ai' ? 'text-ink' : 'text-ink-2'}>{t.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Candidate input */}
        {!blockClosed && (
          <div className="mb-4">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted mb-2">
              {transcript.length === 0 ? 'Your answer' : 'Reply'}
            </div>
            <textarea
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              rows={6}
              placeholder="Type the candidate response here..."
              className="w-full text-[14.5px] leading-relaxed bg-transparent border border-line focus:border-ink outline-none px-4 py-3 rounded resize-y"
              disabled={pending}
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={sendTurn}
                disabled={pending || !candidateInput.trim()}
                className="inline-flex items-center gap-2 bg-ink text-paper text-[13px] px-5 py-2 rounded-full hover:bg-navy disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {pending ? 'Grading...' : 'Send to interviewer'}
                {!pending && <span aria-hidden>{'\u2192'}</span>}
              </button>
              {transcript.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-[12px] font-mono uppercase tracking-widest text-muted hover:text-ink"
                >
                  Reset block
                </button>
              )}
            </div>
            {globalError && (
              <div className="mt-3 text-[12.5px] text-red-700 font-mono">{globalError}</div>
            )}
          </div>
        )}

        {blockClosed && (
          <div className="mb-4 border border-[#a87a1f]/40 bg-[#d4a04a]/[0.08] rounded p-5">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-[#a87a1f] mb-2">Block closed</div>
            <p className="text-[13.5px] text-ink-2 leading-relaxed">
              The interviewer ended this block. Hit <em>Reset block</em> to run another answer against the same question.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 text-[12px] font-mono uppercase tracking-widest text-ink hover:text-[#a87a1f] border border-line hover:border-[#a87a1f] px-3 py-1 rounded transition"
            >
              Reset block
            </button>
          </div>
        )}
      </div>

      {/* Right column: AI verdicts per turn */}
      <aside className="space-y-5">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">AI verdicts</div>
        {turns.length === 0 && (
          <div className="border border-dashed border-line rounded p-5 text-[13px] text-muted">
            Send a response to see the structured feedback the model would emit during a real interview.
          </div>
        )}
        {turns.map((t, i) => (
          <TurnCard key={i} index={i + 1} turn={t} />
        ))}
      </aside>
    </div>
  );
}

function TurnCard({ index, turn }: { index: number; turn: Turn }) {
  const ai = turn.ai;
  if (!ai) return null;
  return (
    <div className="border border-line rounded p-5 space-y-3 bg-paper">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Turn {index}</div>
        <KindBadge kind={ai.kind} />
      </div>
      {ai.grade && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Grade</span>
          <span className="font-serif text-[28px] leading-none">{ai.grade}</span>
        </div>
      )}
      {ai.feedback && (
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted mb-1">Headline</div>
          <p className="text-[13.5px] leading-relaxed">{ai.feedback}</p>
        </div>
      )}
      {ai.kind === 'close_block' && ai.feedback_detail && (
        <div className="space-y-2">
          <DetailRow label="What worked" text={ai.feedback_detail.what_worked} />
          <DetailRow label="What was missing" text={ai.feedback_detail.what_was_missing} />
          <DetailRow label="How to improve" text={ai.feedback_detail.how_to_improve} />
          <DetailRow label="Model-answer pointer" text={ai.feedback_detail.model_answer_pointer} />
        </div>
      )}
      {(ai.strengths.length > 0 || ai.weaknesses.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {ai.strengths.length > 0 && (
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-[#3d7a3d] mb-1">Strengths</div>
              <ul className="text-[12.5px] leading-relaxed space-y-1 list-disc pl-4 marker:text-[#3d7a3d]/60">
                {ai.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {ai.weaknesses.length > 0 && (
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-[#a87a1f] mb-1">Weaknesses</div>
              <ul className="text-[12.5px] leading-relaxed space-y-1 list-disc pl-4 marker:text-[#a87a1f]/60">
                {ai.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      {ai.follow_up_question && ai.kind === 'follow_up' && (
        <div className="mt-2 text-[12.5px] text-ink-2 border-t border-line pt-3">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted mr-2">Follow-up</span>
          {ai.follow_up_question}
        </div>
      )}
      {ai.reply && ai.kind === 'clarification_response' && (
        <div className="mt-2 text-[12.5px] text-ink-2 border-t border-line pt-3">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted mr-2">Reply</span>
          {ai.reply}
        </div>
      )}
      {ai.reasoning && (
        <details className="mt-1">
          <summary className="font-mono text-[10px] uppercase tracking-widest text-muted cursor-pointer">Model reasoning</summary>
          <p className="text-[12px] text-muted mt-1 leading-relaxed">{ai.reasoning}</p>
        </details>
      )}
    </div>
  );
}

function KindBadge({ kind }: { kind: Kind }) {
  const map: Record<Kind, { label: string; cls: string }> = {
    close_block: { label: 'Closed', cls: 'border-[#a87a1f]/40 text-[#a87a1f]' },
    follow_up: { label: 'Follow-up', cls: 'border-line text-ink-2' },
    clarification_response: { label: 'Clarified', cls: 'border-line text-ink-2' },
  };
  const m = map[kind];
  return (
    <span className={`inline-block font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${m.cls}`}>
      {m.label}
    </span>
  );
}

function DetailRow({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className="text-[12.5px] leading-relaxed">{text}</div>
    </div>
  );
}
