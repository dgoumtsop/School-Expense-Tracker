import { prisma } from "@/lib/prisma";

// what would this category's spending be after adding `amount`, vs its budget
export async function getBudgetImpact(
  categoryId: number,
  schoolYearId: number,
  amount: number,
  excludeExpenseId?: number
) {
  const budget = await prisma.budget.findUnique({
    where: { categoryId_schoolYearId: { categoryId, schoolYearId } },
  });
  // no budget set means nothing to compare against
  if (!budget) return null;

  const agg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      categoryId,
      schoolYearId,
      status: "ACTIVE",
      // when editing, the old version of this expense shouldn't count twice
      ...(excludeExpenseId ? { id: { not: excludeExpenseId } } : {}),
    },
  });

  const spentAfter = (agg._sum.amount ?? 0) + amount;
  return {
    budget: budget.amount,
    spentAfter,
    percent: Math.round((spentAfter / budget.amount) * 100),
  };
}
