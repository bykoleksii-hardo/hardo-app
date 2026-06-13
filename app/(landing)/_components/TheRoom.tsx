import RoomInView from './RoomInView';

type Feature = {
  title: string;
  desc: React.ReactNode;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: 'Voice or text',
    desc: 'Speak your answer with a live transcript, or type it. Same scorecard either way.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2.5" width="6" height="11" rx="3" pathLength={1} />
        <path d="M5 11a7 7 0 0 0 14 0" pathLength={1} />
        <line x1="12" y1="18" x2="12" y2="21.5" pathLength={1} />
      </svg>
    ),
  },
  {
    title: 'Unscripted follow-ups',
    desc: <>It presses exactly where your answer is thin — up to <span className="room-feat-num">5</span> on the case study.</>,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16" pathLength={1} /><path d="M4 5v6a4 4 0 0 0 4 4h9" pathLength={1} />
        <path d="M14 11l3 4-3 4" pathLength={1} />
      </svg>
    ),
  },
  {
    title: 'Delivery, scored',
    desc: 'Pace, filler and jargon hygiene — the feedback you never get anywhere else.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13a9 9 0 0 1 18 0" pathLength={1} />
        <line x1="12" y1="13" x2="16" y2="9" pathLength={1} />
        <line x1="3" y1="13" x2="4.5" y2="13" pathLength={1} /><line x1="19.5" y1="13" x2="21" y2="13" pathLength={1} />
      </svg>
    ),
  },
  {
    title: 'A real verdict',
    desc: <>Letter grade per answer, a <span className="room-feat-num">6</span>-axis skill radar, and a hire call at the end.</>,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" pathLength={1} />
        <path d="M8 8h5" pathLength={1} /><path d="M8 12h8" pathLength={1} /><path d="M8 16h6" pathLength={1} />
        <path d="M16.5 6.5l1.2 1.2 2-2.4" pathLength={1} />
      </svg>
    ),
  },
];

export default function TheRoom() {
  return (
    <section className="room">
      <div
        aria-hidden
        className="room-ring room-ring--pulse"
        style={{ width: 520, height: 520, top: '-220px', right: '-160px' }}
      />

      <RoomInView>
        <div className="relative max-w-page mx-auto px-6 py-24 md:py-28">
          <div className="max-w-3xl">
            <div className="room-eyebrow r-anim mb-6" style={{ '--d': '0ms' } as React.CSSProperties}>Inside the room</div>
            <h2 className="room-title r-anim" style={{ '--d': '90ms' } as React.CSSProperties}>
              A mock interview that{' '}
              <em>pushes back.</em>
            </h2>
            <p className="room-sub r-anim mt-6 max-w-2xl text-[17px]" style={{ '--d': '200ms' } as React.CSSProperties}>
              Twelve questions a session — technicals, behavioral, a case — across three levels,
              graded like a real superday. Here&rsquo;s what happens in the room.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="room-feat" style={{ '--d': `${360 + i * 110}ms` } as React.CSSProperties}>
                <span className="room-feat-ico" aria-hidden>{f.icon}</span>
                <h3 className="room-feat-title">{f.title}</h3>
                <p className="room-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RoomInView>
    </section>
  );
}
