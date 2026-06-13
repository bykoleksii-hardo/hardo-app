import RoomInView from './RoomInView';

const WAVE_BARS = [16, 28, 44, 34, 52, 24, 42, 20, 34, 14, 30, 22];

type Feature = {
  index: string;
  chip: string;
  title: string;
  desc: React.ReactNode;
  visual: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    index: '01',
    chip: 'Voice + text',
    title: 'Answer out loud, or type',
    desc: 'Speak with a live transcript like the real room, or type when you want to think on the page. Same scorecard either way.',
    visual: (
      <div className="rm-wave" aria-hidden>
        {WAVE_BARS.map((h, i) => (
          <i key={i} style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }} />
        ))}
        <span className="rm-caret" />
      </div>
    ),
  },
  {
    index: '02',
    chip: 'Up to 5 deep',
    title: 'Follow-ups that dig',
    desc: <>It presses exactly where your answer is thin &mdash; up to <span className="room-feat-num">5</span> on the case study, just like a real interviewer.</>,
    visual: (
      <svg width="138" height="64" viewBox="0 0 138 64" fill="none" stroke="#B88736" strokeWidth="1.5" aria-hidden>
        <circle cx="12" cy="32" r="4.5" fill="#B88736" stroke="none" />
        <path d="M17 32 H52" strokeLinecap="round" />
        <path d="M52 32 C 72 32, 76 12, 92 12" strokeLinecap="round" />
        <path d="M52 32 H92" strokeLinecap="round" />
        <path d="M52 32 C 72 32, 76 52, 92 52" strokeLinecap="round" />
        <circle className="rm-node rm-node--1" cx="96" cy="12" r="4" fill="#B88736" stroke="none" />
        <circle className="rm-node rm-node--2" cx="96" cy="32" r="4" fill="#B88736" stroke="none" />
        <circle className="rm-node rm-node--3" cx="96" cy="52" r="4" fill="#B88736" stroke="none" />
      </svg>
    ),
  },
  {
    index: '03',
    chip: 'Delivery graded',
    title: 'Pace, filler, jargon',
    desc: 'We score how you sound, not just what you say — the delivery feedback you never get anywhere else.',
    visual: (
      <svg width="138" height="80" viewBox="0 0 138 80" fill="none" aria-hidden>
        <path d="M14 68 A52 52 0 0 1 118 68" stroke="rgba(184,135,54,0.28)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 68 A52 52 0 0 1 92 19" stroke="#B88736" strokeWidth="2.5" strokeLinecap="round" />
        <line className="rm-needle" x1="66" y1="68" x2="66" y2="24" stroke="#F6F0E2" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="66" cy="68" r="4.5" fill="#B88736" />
      </svg>
    ),
  },
  {
    index: '04',
    chip: 'Letter grades',
    title: 'A verdict, not vibes',
    desc: <>A grade per answer, a <span className="room-feat-num">6</span>-axis skill radar, and an honest hire call at the end.</>,
    visual: (
      <div className="rm-grade-wrap" aria-hidden>
        <svg width="62" height="62" viewBox="0 0 64 64" fill="none">
          <polygon points="32,8 52.8,20 52.8,44 32,56 11.2,44 11.2,20" stroke="rgba(184,135,54,0.4)" strokeWidth="1" fill="rgba(184,135,54,0.05)" />
          <polygon points="32,12 44.1,25 47.6,41 32,54 21.6,38 18.1,24" stroke="#B88736" strokeWidth="1.5" fill="rgba(184,135,54,0.16)" />
        </svg>
        <span className="rm-grade">A{'−'}</span>
      </div>
    ),
  },
];

export default function TheRoom() {
  return (
    <section className="room">
      {/* light melts into the dark room at the top, and back into light at the bottom */}
      <div className="room__fade room__fade--top" aria-hidden />

      <div
        aria-hidden
        className="room-ring room-ring--pulse"
        style={{ width: 520, height: 520, top: '-220px', right: '-160px' }}
      />

      <RoomInView>
        <div className="room__inner max-w-page mx-auto px-6 py-28 md:py-[22vh]">
          <div className="max-w-3xl">
            <div className="room-eyebrow r-anim mb-6" style={{ '--d': '0ms' } as React.CSSProperties}>Inside the room</div>
            <h2 className="room-title r-anim" style={{ '--d': '90ms' } as React.CSSProperties}>
              A mock interview that{' '}
              <em>pushes back.</em>
            </h2>
            <p className="room-sub r-anim mt-6 max-w-2xl text-[17px]" style={{ '--d': '200ms' } as React.CSSProperties}>
              Twelve questions a session — technicals, behavioral, a case — across three levels,
              graded like a real superday. Four things make it bite.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <article key={f.index} className="room-card" style={{ '--d': `${340 + i * 130}ms` } as React.CSSProperties}>
                <div className="room-card__top">
                  <span className="room-card__idx">{f.index}</span>
                  <span className="room-card__chip">{f.chip}</span>
                </div>
                <div className="room-card__visual">{f.visual}</div>
                <h3 className="room-card__title">{f.title}</h3>
                <p className="room-card__desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </RoomInView>

      <div className="room__fade room__fade--bottom" aria-hidden />
    </section>
  );
}
