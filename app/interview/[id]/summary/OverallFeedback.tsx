/* The "Overall feedback" block on the scorecard. Same substance as before —
   lead verdict, strongest moment, weakest block, prep plan, strengths and
   weaknesses — but restructured to be visual and scannable instead of a wall
   of prose: tinted panels with icons, bulleted strengths/weaknesses, and
   numbered prep steps. */

import { Check, Arrow, FeedbackPanel, RubricBars, type RubricAxisView } from './feedbackUi';

type Props = {
  summary: string;
  strongestMoment: string;
  weakestBlock: string;
  prepPlan: string[];
  strengths: string;
  weaknesses: string;
  rubricProfile?: RubricAxisView[] | null;
};

// Split a prose blob into scannable items. Prefer real line breaks / bullet
// chars; never sentence-split (finance abbreviations like "M&A." would break).
function toBullets(raw: string): string[] {
  if (!raw) return [];
  const parts = raw
    .split(/\n+|(?:^|\s)[•·–-]\s+/g)
    .map((s) => s.trim().replace(/^[•·–-]\s*/, '').trim())
    .filter(Boolean);
  return parts.length ? parts : [raw.trim()];
}

function Highlight({ tone, label, text }: { tone: 'pos' | 'neg'; label: string; text: string }) {
  const pos = tone === 'pos';
  const color = pos ? '#1F6F3D' : '#9C2E2E';
  return (
    <div className="rounded-md px-4 py-3" style={{ border: `1px solid ${color}30`, background: `${color}0A` }}>
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {pos ? <Check /> : <Arrow />}
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{label}</span>
      </div>
      <p className="text-ink/85 text-[13px] leading-[1.55]">{text}</p>
    </div>
  );
}

export default function OverallFeedback({ summary, strongestMoment, weakestBlock, prepPlan, strengths, weaknesses, rubricProfile }: Props) {
  const strengthItems = toBullets(strengths);
  const weaknessItems = toBullets(weaknesses);

  return (
    <div className="border border-gold/30 bg-cream/30 p-6 sm:p-8 mb-12">
      <div className="text-[11px] tracking-[0.22em] text-gold mb-5">— OVERALL FEEDBACK</div>

      {summary && (
        <p className="font-serif text-[17px] sm:text-[19px] leading-[1.55] text-ink mb-6 whitespace-pre-wrap">{summary}</p>
      )}

      {rubricProfile && rubricProfile.length > 0 && (
        <div className="rounded-md border border-ink/10 bg-paper/50 px-5 py-4 mb-3">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45 mb-3">Skill profile <span className="text-ink/30 normal-case tracking-normal">· averaged across blocks</span></div>
          <RubricBars axes={rubricProfile} />
        </div>
      )}

      {(strongestMoment || weakestBlock) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          {strongestMoment && <Highlight tone="pos" label="Strongest moment" text={strongestMoment} />}
          {weakestBlock && <Highlight tone="neg" label="Weakest block" text={weakestBlock} />}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <FeedbackPanel tone="pos" label="Strengths" items={strengthItems} />
        <FeedbackPanel tone="neg" label="Weaknesses" items={weaknessItems} />
      </div>

      {prepPlan.length > 0 && (
        <div className="mt-3 rounded-md border border-gold/30 bg-gold/[0.05] px-5 py-4">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-3">Your prep plan</div>
          <ol className="space-y-2.5">
            {prepPlan.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gold/15 text-gold font-mono text-[11px] flex items-center justify-center">{i + 1}</span>
                <span className="text-ink/85 text-[14px] leading-[1.55] pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
