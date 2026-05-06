// Server-renderable SVG skill radar
// dynamic axes; each `score` is 0..10 or null

const SIZE = 600;
const SIZE_Y = 540;
const CENTER_X = SIZE / 2; // 300
const CENTER_Y = SIZE_Y / 2; // 270
const RADIUS = 180;
const RINGS = 5;

interface Axis {
  key: string;
  label: string;
  score: number | null;
  sample_size: number;
  trend?: 'up' | 'down' | 'flat' | null;
}

function angleFor(i: number, total: number) {
  // start at top (-pi/2) and go clockwise
  return -Math.PI / 2 + (i / total) * Math.PI * 2;
}

export function SkillRadar({ axes, hireBar = 6 }: { axes: Axis[]; hireBar?: number }) {
  const points = axes.map((a, i) => {
    const angle = angleFor(i, axes.length);
    const r = a.score != null ? (a.score / 10) * RADIUS : 0;
    const anchor =
      Math.abs(Math.cos(angle)) < 0.2
        ? 'middle'
        : Math.cos(angle) > 0
        ? 'start'
        : 'end';
    return {
      ...a,
      angle,
      anchor,
      x: CENTER_X + Math.cos(angle) * r,
      y: CENTER_Y + Math.sin(angle) * r,
      labelX: CENTER_X + Math.cos(angle) * (RADIUS + 32),
      labelY: CENTER_Y + Math.sin(angle) * (RADIUS + 32),
      axisX: CENTER_X + Math.cos(angle) * RADIUS,
      axisY: CENTER_Y + Math.sin(angle) * RADIUS,
    };
  });

  const polygon = points
    .filter((p) => p.score != null)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  // Hire-bar polygon (target zone) — closed ring at hireBar score on every axis
  const hireRadius = (Math.max(0, Math.min(10, hireBar)) / 10) * RADIUS;
  const hirePolygon = points
    .map((_p, i) => {
      const a = angleFor(i, axes.length);
      return `${CENTER_X + Math.cos(a) * hireRadius},${CENTER_Y + Math.sin(a) * hireRadius}`;
    })
    .join(' ');

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE_Y}`}
        className="h-auto w-full max-w-[600px]"
        role="img"
        aria-label="Skill radar"
      >
        {/* Concentric rings */}
        {Array.from({ length: RINGS }).map((_, i) => {
          const r = ((i + 1) / RINGS) * RADIUS;
          return (
            <circle
              key={i}
              cx={CENTER_X}
              cy={CENTER_Y}
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
            key={`axis-${i}`}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={p.axisX}
            y2={p.axisY}
            stroke="rgba(245,239,226,0.10)"
            strokeWidth={1}
          />
        ))}

        {/* Hire-bar (target zone) polygon — drawn under data polygon */}
        <polygon
          points={hirePolygon}
          fill="none"
          stroke="rgba(184,135,54,0.45)"
          strokeWidth={1.25}
          strokeDasharray="4 4"
        />

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
            <circle
              key={`pt-${i}`}
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill="#B88736"
            />
          ) : null
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const anchor = p.anchor;
          const arrow = p.trend === 'up' ? ' ↑' : p.trend === 'down' ? ' ↓' : '';
          return (
            <g key={`label-${i}`}>
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={p.score == null ? "fill-[#11161E]/45" : p.score >= 6 ? "fill-[#1F6F3D]" : p.score >= 4 ? "fill-[#A85A1F]" : "fill-[#9C2E2E]"}
                style={{ fontSize: 13, letterSpacing: '0.05em' }}
              >
                {p.label.toUpperCase()}{arrow}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 14}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-[#11161E]/55"
                style={{ fontSize: 11, letterSpacing: '0.05em' }}
              >
                {p.score !== null ? p.score.toFixed(1) : p.sample_size === 0 ? '—' : `n=${p.sample_size}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
