// Server-renderable SVG skill radar
// 7 axes; each `score` is 0..10 or null

const SIZE = 520;
const CENTER = SIZE / 2; // 260
const RADIUS = 180;
const RINGS = 5;

interface Axis { key: string; label: string; score: number | null; sample_size: number }

function angleFor(i: number, total: number) {
  return -Math.PI / 2 + (i * 2 * Math.PI) / total;
}

export function SkillRadar({ data }: { data: Axis[] }) {
  const N = data.length;
  const points = data.map((d, i) => {
    const angle = angleFor(i, N);
    const r = (d.score ?? 0) / 10 * RADIUS;
    return {
      ...d,
      angle,
      x: CENTER + Math.cos(angle) * r,
      y: CENTER + Math.sin(angle) * r,
      labelX: CENTER + Math.cos(angle) * (RADIUS + 32),
      labelY: CENTER + Math.sin(angle) * (RADIUS + 32),
      axisX: CENTER + Math.cos(angle) * RADIUS,
      axisY: CENTER + Math.sin(angle) * RADIUS,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full flex justify-center">
      <svg viewBox={`-130 -30 780 600`} className="w-full max-w-[640px] h-auto">
        {/* Background rings */}
        {Array.from({ length: RINGS }).map((_, i) => {
          const r = ((i + 1) / RINGS) * RADIUS;
          return (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke="rgba(245,239,226,0.08)"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.axisX}
            y2={p.axisY}
            stroke="rgba(245,239,226,0.10)"
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={polygon}
          fill="rgba(212,160,74,0.18)"
          stroke="#B88736"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          p.score !== null ? (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill="#B88736" />
          ) : null
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const cos = Math.cos(p.angle);
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : (cos < 0 ? 'end' : 'start');
          return (
            <g key={`label-${i}`}>
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-[#11161E]/85"
                style={{ fontSize: 13, letterSpacing: '0.05em' }}
              >
                {p.label}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 16}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-[#B88736]"
                style={{ fontSize: 11, letterSpacing: '0.05em' }}
              >
                {p.score !== null ? p.score.toFixed(1) : '—'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
