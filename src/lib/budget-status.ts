export type BudgetTone = "ok" | "warn" | "over";

// how much of a budget is used, and what that means
// 80% and up is a warning, going past the budget is over
export function budgetUsage(spent: number, budget: number) {
  const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  if (spent > budget) {
    return { percent, tone: "over" as BudgetTone, label: "Over budget" };
  }
  if (percent >= 80) {
    return { percent, tone: "warn" as BudgetTone, label: "Near limit" };
  }
  return { percent, tone: "ok" as BudgetTone, label: "On track" };
}
