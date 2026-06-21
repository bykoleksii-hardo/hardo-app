import Reveal from '@/app/_components/Reveal';
import Parallax from '@/app/_components/Parallax';

export default function WhatWeMeasure() {
  return (
    <section id="what-we-measure" className="relative overflow-hidden border-t border-line bg-cream/60">
      <Parallax ariaHidden speed={0.18} className="bg-orb" style={{ bottom: '-200px', left: '-160px' }} />
      <div className="relative mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <Reveal>
          <div className="eyebrow"><span className="dash" aria-hidden /> What we measure</div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="ww-h2">
            One scorecard. One <span className="italic-gold">verdict</span><span style={{color:'var(--gold)'}}>.</span>
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <div className="ww-lede">
            <p>
              Every interview ends with a director-grade rubric: a letter, a skill profile, follow-up depth, and a hire call &mdash; then the model answer for every question.
              No vibes, no participation trophies.
            </p>
            <blockquote className="ww-pullquote">
              If a director can&rsquo;t grade it on paper, neither will we.
            </blockquote>
          </div>
        </Reveal>

        <div className="ww-grid">
          {/* 1. Letter grade */}
          <Reveal delay={200}>
            <article className="ww-card">
              <header className="ww-cardhead">
                <span className="ww-name">Letter grade</span>
                <span className="ww-idx">&mdash; 01 / 04</span>
              </header>
              <h3 className="ww-headline">
                A single mark, weighted across <em>every</em> category.
              </h3>
              <p className="ww-desc">
                Accounting, valuation, M&amp;A, PE/LBO, behavioral &mdash; combined into one letter you can quote in a follow-up email.
              </p>
              <div className="ww-vis ww-vis-grade">
                <div className="ww-bigA">A</div>
                <ol className="ww-scale" aria-label="Grade scale">
                  <li className="ww-now">A</li>
                  <li>B</li>
                  <li>C</li>
                  <li>D</li>
                  <li>F</li>
                </ol>
              </div>
            </article>
          </Reveal>

          {/* 2. Skill radar */}
          <Reveal delay={260}>
            <article className="ww-card">
              <header className="ww-cardhead">
                <span className="ww-name">Skill radar</span>
                <span className="ww-idx">&mdash; 02 / 04</span>
              </header>
              <h3 className="ww-headline">
                Six axes. <em>No averaging</em> away a weak spot.
              </h3>
              <p className="ww-desc">
                Each competency is graded on its own. You see exactly where the gap is &mdash; and what to drill before next round.
              </p>
              <div className="ww-vis ww-vis-radar">
                <svg viewBox="-80 -80 160 160" className="ww-radar" role="img" aria-label="Skill radar">
                  {/* concentric hex rings */}
                  {[20, 40, 60].map((r) => (
                    <polygon
                      key={r}
                      points={[0,1,2,3,4,5].map(i => {
                        const a = (Math.PI / 3) * i - Math.PI / 2;
                        return (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1);
                      }).join(' ')}
                      fill="none"
                      stroke="var(--line)"
                      strokeWidth="0.7"
                    />
                  ))}
                  {/* axes */}
                  {[0,1,2,3,4,5].map(i => {
                    const a = (Math.PI / 3) * i - Math.PI / 2;
                    const x = (Math.cos(a) * 60).toFixed(1);
                    const y = (Math.sin(a) * 60).toFixed(1);
                    return <line key={i} x1="0" y1="0" x2={x} y2={y} stroke="var(--line)" strokeWidth="0.6" />;
                  })}
                  {/* target dashed polygon (uniform at ~50) */}
                  <polygon
                    points={[0,1,2,3,4,5].map(i => {
                      const a = (Math.PI / 3) * i - Math.PI / 2;
                      return (Math.cos(a) * 50).toFixed(1) + ',' + (Math.sin(a) * 50).toFixed(1);
                    }).join(' ')}
                    fill="none"
                    stroke="var(--ink-2)"
                    strokeOpacity="0.45"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  {/* score polygon */}
                  <polygon
                    className="ww-score-poly"
                    points={[55, 48, 42, 32, 50, 58].map((r, i) => {
                      const a = (Math.PI / 3) * i - Math.PI / 2;
                      return (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1);
                    }).join(' ')}
                    fill="var(--gold-soft)"
                    stroke="var(--gold)"
                    strokeWidth="1.4"
                  />
                </svg>
                <ul className="ww-axes" aria-hidden>
                  <li>Accounting</li>
                  <li>&middot;</li>
                  <li>Valuation</li>
                  <li>&middot;</li>
                  <li>Corp Finance</li>
                  <li>&middot;</li>
                  <li>M&amp;A / Case</li>
                  <li>&middot;</li>
                  <li>PE / LBO</li>
                  <li>&middot;</li>
                  <li>Behavioral</li>
                </ul>
              </div>
            </article>
          </Reveal>

          {/* 3. Follow-up depth */}
          <Reveal delay={320}>
            <article className="ww-card">
              <header className="ww-cardhead">
                <span className="ww-name">Follow-up depth</span>
                <span className="ww-idx">&mdash; 03 / 04</span>
              </header>
              <h3 className="ww-headline">
                How far do you hold under <em>pressure</em>?
              </h3>
              <p className="ww-desc">
                We push every answer with follow-ups until you break or land it. The depth you held is on the report.
              </p>
              <div className="ww-vis ww-vis-dots">
                <ol className="ww-dots" aria-label="Follow-up depth: held through follow-up 3 of 5">
                  <li className="on" />
                  <li className="on" />
                  <li className="on" />
                  <li />
                  <li />
                </ol>
                <div className="ww-dotslabel">Through #3 &middot; held &mdash; then thinned</div>
              </div>
            </article>
          </Reveal>

          {/* 4. Hire call */}
          <Reveal delay={380}>
            <article className="ww-card">
              <header className="ww-cardhead">
                <span className="ww-name">Hire call</span>
                <span className="ww-idx">&mdash; 04 / 04</span>
              </header>
              <h3 className="ww-headline">
                The verdict a <em>director</em> would write.
              </h3>
              <p className="ww-desc">
                One of four rungs, with a one-line reason. The same call you&rsquo;d get in a real debrief &mdash; just earlier, and free.
              </p>
              <div className="ww-vis ww-vis-ladder">
                <ol className="ww-ladder" aria-label="Hire ladder">
                  <li><span className="rung" /><span className="lab">Hire</span></li>
                  <li className="ww-here"><span className="rung" /><span className="lab">Leaning hire</span><span className="pin">&larr; You</span></li>
                  <li><span className="rung" /><span className="lab">Leaning no-hire</span></li>
                  <li><span className="rung" /><span className="lab">No hire</span></li>
                </ol>
              </div>
            </article>
          </Reveal>
        </div>

        <Reveal delay={420} as="article" className="ww-answerkey">
          <div>
            <div className="eyebrow"><span className="dash" aria-hidden /> After the grade {'·'} The answer key</div>
            <h3 className="ww-ak-headline">
              You don&rsquo;t just get graded. <em>You get the answer.</em>
            </h3>
            <p className="ww-ak-desc">
              Every question, once you&rsquo;re scored: the points a strong answer has to hit, and a model answer written to the bar. The gap between what you said and what lands &mdash; on paper.
            </p>
          </div>
          <div className="ww-ak-card">
            <div className="ww-ak-label">What a strong answer covers</div>
            <ul className="ww-ak-covers">
              <li><span className="ww-ak-check" aria-hidden>{'✓'}</span>Risk-adjusted NPV &mdash; peak sales weighted by phase probability.</li>
              <li><span className="ww-ak-check" aria-hidden>{'✓'}</span>Discount rate set to the binary clinical risk, not a mature-pharma rate.</li>
              <li><span className="ww-ak-check" aria-hidden>{'✓'}</span>Cross-checked against comparable deal value per pipeline asset.</li>
            </ul>
            <div className="ww-ak-model">
              <div className="ww-ak-label">Model answer</div>
              <p>Build an rNPV: project peak sales, probability-weight by phase, discount at 12&ndash;15% for clinical risk, then sanity-check against recent comparable transactions.</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={460}>
          <ul className="ww-chips" aria-label="Other signals we surface">
            <li className="gold"><span className="dot" aria-hidden /> Rubric on every answer</li>
            <li className="gold"><span className="dot" aria-hidden /> Model answer on every question</li>
            <li><span className="dot" aria-hidden /> Calibrated to director bar</li>
            <li><span className="dot" aria-hidden /> Cited from real banker workflow</li>
            <li><span className="dot" aria-hidden /> Reproducible across runs</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
