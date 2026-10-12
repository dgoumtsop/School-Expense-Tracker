import { fcfa } from "@/lib/format";

// future months are drawn as empty room on the right, with no dot and no line
export type SpendingPoint = { label: string; total: number; cumulative: number; future?: boolean };

// a round step (1, 2, 5 times a power of ten) so the axis reads 10M, 20M, 30M and not 12.54M
function niceStep(rough: number) {
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

// 1,250,000 -> "1.25M", keeps the axis short
function short(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

// running total of spending month by month, with the total budget as a dashed line to stay under
export function SpendingChart({
  points,
  budget,
}: {
  points: SpendingPoint[];
  budget: number;
}) {
  const W = 720;
  const H = 260;
  const pad = { top: 16, right: 16, bottom: 32, left: 56 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const spentPoints = points.filter((p) => !p.future);
  const last = spentPoints[spentPoints.length - 1]?.cumulative ?? 0;
  const step = niceStep(Math.max(budget, last, 1) / 4);
  const top = Math.ceil((Math.max(budget, last, 1) * 1.05) / step) * step;

  const x = (i: number) =>
    pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;

  const line = spentPoints.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.cumulative)}`).join(" ");
  const area = spentPoints.length > 1
    ? `${line} L${x(spentPoints.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
    : "";

  const ticks: number[] = [];
  for (let t = 0; t <= top + 1; t += step) ticks.push(t);
  // with many months only label some so they never overlap
  const every = Math.ceil(points.length / 7);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Spending so far is ${fcfa(last)} FCFA against a budget of ${fcfa(budget)} FCFA.`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
            {short(Math.round(t))}
          </text>
        </g>
      ))}

      {budget > 0 && (
        <g>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={y(budget)}
            y2={y(budget)}
            stroke="var(--color-ink)"
            strokeOpacity="0.55"
            strokeDasharray="5 4"
          />
          <text x={W - pad.right} y={y(budget) - 6} textAnchor="end" fontSize="11" fill="var(--color-ink)">
            Total budget {short(budget)}
          </text>
        </g>
      )}

      {area && <path d={area} fill="var(--color-accent)" fillOpacity="0.1" />}
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {spentPoints.map((p, i) => (
        <circle key={p.label} cx={x(i)} cy={y(p.cumulative)} r="3.5" fill="white" stroke="var(--color-accent)" strokeWidth="2">
          <title>{`${p.label}: ${fcfa(p.total)} FCFA this month, ${fcfa(p.cumulative)} FCFA in total`}</title>
        </circle>
      ))}

      {points.map((p, i) =>
        i % every === 0 ? (
          <text key={p.label} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
            {p.label}
          </text>
        ) : null
      )}
    </svg>
  );
}
