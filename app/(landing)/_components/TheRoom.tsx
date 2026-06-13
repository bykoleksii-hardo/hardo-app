import Reveal from '@/app/_components/Reveal';

const STATS: Array<{ n: string; l: string }> = [
  { n: '3', l: 'Levels · intern to associate' },
  { n: '12', l: 'Questions a session' },
  { n: '6', l: 'Axes graded' },
  { n: '∞', l: 'Reps on the paid plan' },
];

export default function TheRoom() {
  return (
    <section className="room">
      {/* Decorative breathing rings */}
      <div
        aria-hidden
        className="room-ring room-ring--pulse"
        style={{ width: 520, height: 520, top: '-180px', right: '-120px' }}
      />
      <div
        aria-hidden
        className="room-ring"
        style={{ width: 820, height: 820, bottom: '-460px', left: '-200px' }}
      />

      <div className="relative max-w-page mx-auto px-6 py-28 md:py-36">
        <Reveal>
          <div className="max-w-3xl">
            <div className="room-eyebrow mb-6">The room</div>
            <h2 className="room-title">
              Step into the room{' '}
              <em>before it&rsquo;s real.</em>
            </h2>
            <p className="room-sub mt-7 max-w-xl text-[17px]">
              Voice or text, the interviewer presses exactly where you&rsquo;re soft, follows up like a
              real banker, and grades the delivery you never get feedback on &mdash; pace, filler, jargon
              hygiene. You walk into the real one already rehearsed.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-16">
            <div className="room-divider mb-10" />
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
              {STATS.map((s) => (
                <div key={s.l}>
                  <dt className="room-stat-n">{s.n}</dt>
                  <dd className="room-stat-l mt-2 leading-relaxed max-w-[14ch]">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
