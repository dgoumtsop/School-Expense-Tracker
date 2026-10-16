import { prisma } from "@/lib/prisma";

// first day of the expense's month and first day of the next one, in UTC
// (dates are saved as UTC midnight, so UTC keeps the 1st and the 31st in the right month)
export function monthWindow(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return { start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m + 1, 1)) };
}

// what would this category's spending be after adding `amount`, vs its budget
export async function getBudgetImpact(
  categoryId: number,
  schoolYearId: number,
  amount: number,
  date: Date,
  excludeExpenseId?: number
) {
  const budget = await prisma.budget.findUnique({
    where: { categoryId_schoolYearId: { categoryId, schoolYearId } },
  });
  // no budget set means nothing to compare against
  if (!budget) return null;

  // a monthly budget only looks at the month of this expense, a yearly one at the whole year
  const window = budget.period === "MONTHLY" ? monthWindow(date) : null;

  const agg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      categoryId,
      schoolYearId,
      status: "ACTIVE",
      ...(window ? { date: { gte: window.start, lt: window.end } } : {}),
      // when editing, the old version of this expense shouldn't count twice
      ...(excludeExpenseId ? { id: { not: excludeExpenseId } } : {}),
    },
  });

  const spentAfter = (agg._sum.amount ?? 0) + amount;
  return {
    budget: budget.amount,
    period: budget.period,
    spentAfter,
    percent: Math.round((spentAfter / budget.amount) * 100),
  };
}