// Server-renderable SVG skill radar
// dynamic axes; each `score` is 0..10 or null
// Empty state renders a faint ghost polygon at the hire-bar radius.
// Tooltips via native SVG <title> on each axis label group.

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

function trendArrow(trend: Axis['trend']): string {
  if (trend === 'up') return ' \u2191';
  if (trend === 'down') return ' \u2193';
  if (trend === 'flat') return ' \u2192';
  return '';
}

function axisTooltip(a: Axis): string {
  const head = a.label;
  const body = a.score == null
    ? a.sample_size === 0
      ? 'No data yet'
      : `Need n\u22653 to plot (have n=${a.sample_size})`
    : `${a.score.toFixed(1)} / 10\u2003\u00b7\u2003n=${a.sample_size}${trendArrow(a.trend)}`;
  return `${head}\n${body}`;
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

  const hasAnyData = axes.some((a) => a.score != null);

  const polygon = points
    .map((p) => (p.score != null ? `${p.x},${p.y}` : `${CENTER_X},${CENTER_Y}`))
    .join(' ');

  const hireRadius = (hireBar / 10) * RADIUS;
  const hirePolygon = points
    .map((_p, i) => {
      const a = angleFor(i, axes.length);
      return `${CENTER_X + Math.cos(a) * hireRadius},${CENTER_Y + Math.sin(a) * hireRadius}`;
    })
    .join(' ');

  // Ghost polygon for the empty state \u2014 sits at the hire-bar radius so users
  // see the target shape before they have any data of their own.
  const ghostPolygon = hirePolygon;

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE_Y}`}
        className="w-full max-w-[600px] h-auto"
        role="img"
        aria-label="Skill radar across IB interview phases"
      >
        {/* Concentric rings */}
        {Array.from({ length: RINGS }).map((_, i) => {
          const r = ((i + 1) / RINGS) * RADIUS;
          return (
            <circle
              key={`ring-${i}`}
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
            stroke="rgba(245,239,226,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Hire-bar reference (dashed) */}
        <polygon
          points={hirePolygon}
          fill="none"
          stroke="rgba(184,135,54,0.35)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Empty-state ghost polygon: faint fill at hire-bar shape */}
        {!hasAnyData && (
          <polygon
            points={ghostPolygon}
            fill="rgba(184,135,54,0.05)"
            stroke="rgba(184,135,54,0.20)"
            strokeWidth={1.5}
            strokeDasharray="2 6"
          />
        )}

        {/* Data polygon */}
        {hasAnyData && (
          <polygon
            points={polygon}
            fill="rgba(212,160,74,0.18)"
            stroke="#B88736"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {points.map((p, i) =>
          p.score !== null ? (
            <circle
              key={`pt-${i}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#B88736"
              stroke="#FBF7EE"
              strokeWidth={1.5}
            />
          ) : null,
        )}

        {/* Axis labels with native SVG tooltips */}
        {points.map((p, i) => {
          const tooltip = axisTooltip(p);
          return (
            <g key={`label-${i}`}>
              <title>{tooltip}</title>
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={p.anchor as 'start' | 'middle' | 'end'}
                dominantBaseline="middle"
                className={
                  p.score == null
                    ? 'fill-[#11161E]/45'
                    : p.score >= 6
                    ? 'fill-[#1F6F3D]'
                    : p.score >= 4
                    ? 'fill-[#A85A1F]'
                    : 'fill-[#11161E]/55'
                }
                style={{ fontSize: 11, letterSpacing: '0.05em' }}
              >
                {p.label}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 14}
                textAnchor={p.anchor as 'start' | 'middle' | 'end'}
                dominantBaseline="middle"
                className="fill-[#11161E]/50"
                style={{ fontSize: 10, letterSpacing: '0.05em' }}
              >
                {p.score !== null
                  ? `${p.score.toFixed(1)}${trendArrow(p.trend)}`
                  : p.sample_size === 0
                  ? '\u2014'
                  : `n=${p.sample_size}`}
              </text>
            </g>
          );
        })}

        {/* Empty-state center caption */}
        {!hasAnyData && (
          <text
            x={CENTER_X}
            y={CENTER_Y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#11161E]/55"
            style={{ fontSize: 12, letterSpacing: '0.04em' }}
          >
            Finish a few interviews to plot your shape.
          </text>
        )}
      </svg>
    </div>
  );
}
