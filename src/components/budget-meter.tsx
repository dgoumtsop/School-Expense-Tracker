import type { BudgetTone } from "@/lib/budget-status";

const FILL: Record<BudgetTone, string> = {
  ok: "bg-good",
  warn: "bg-warn-soft0",
  over: "bg-bad",
};

const BADGE: Record<BudgetTone, string> = {
  ok: "bg-good-soft text-good-ink",
  warn: "bg-warn-soft text-warn-ink",
  over: "bg-bad-soft text-bad-ink",
};

// bar fills up to 100%, the thin mark sits on the 80% warning line
export function ProgressBar({ percent, tone }: { percent: number; tone: BudgetTone }) {
  const width = Math.max(0, Math.min(percent, 100));

  return (
    <div
      className="relative h-2 w-full rounded-full bg-line"
      role="progressbar"
      aria-label="Budget used"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={width}
    >
      <div className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${width}%` }} />
      <div
        className="absolute -top-[3px] -bottom-[3px] w-px bg-ink/50"
        style={{ left: "80%" }}
        aria-hidden
      />
    </div>
  );
}

// the word is always shown, so color is never the only signal
export function StatusBadge({ tone, label }: { tone: BudgetTone; label: string }) {
  return <span className={`badge ${BADGE[tone]}`}>{label}</span>;
}
