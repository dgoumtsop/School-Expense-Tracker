import type { BudgetTone } from "@/lib/budget-status";

const STROKE: Record<BudgetTone, string> = {
  ok: "#059669",
  warn: "#f59e0b",
  over: "#dc2626",
};

// ring that fills as the year's budget gets used, past 100% it stays full and turns red
export function BudgetRing({
  percent,
  tone,
  caption,
}: {
  percent: number;
  tone: BudgetTone;
  caption: string;
}) {
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(percent, 100)) / 100;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${percent}% of the budget used. ${caption}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold tabular-nums">{percent}%</span>
        <span className="mt-0.5 max-w-24 text-xs leading-tight text-muted">{caption}</span>
      </div>
    </div>
  );
}
