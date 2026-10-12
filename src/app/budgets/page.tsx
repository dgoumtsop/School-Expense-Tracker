import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ProgressBar, StatusBadge } from "@/components/budget-meter";
import { budgetUsage } from "@/lib/budget-status";
import { fcfa } from "@/lib/format";
import { setBudget } from "./actions";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });

  const budgets = await prisma.budget.findMany({
    where: { schoolYear: { isActive: true } },
    include: { category: true },
    orderBy: { amount: "desc" },
  });

  // categories for the dropdown, archived ones stay out
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  // total spent per category this year, cancelled expenses don't count
  const spentRows = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { status: "ACTIVE", schoolYear: { isActive: true } },
    _sum: { amount: true },
  });

  // turn the rows into a lookup: categoryId -> total spent
  const spentByCategory = new Map(
    spentRows.map((r) => [r.categoryId, r._sum.amount ?? 0])
  );

  // categories that have spending but no budget row, they'd be invisible otherwise
  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgetedRows = spentRows.filter((r) => !budgetedIds.has(r.categoryId));
  const unbudgetedCategories = unbudgetedRows.length
    ? await prisma.category.findMany({
        where: { id: { in: unbudgetedRows.map((r) => r.categoryId) } },
      })
    : [];
  const nameById = new Map(unbudgetedCategories.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Budgets"
        description={
          year
            ? `School year ${year.name}. Setting a budget for a category that already has one replaces the amount.`
            : "No school year is active, so there are no budgets to show."
        }
      />

      {categories.length === 0 ? (
        <div className="panel mb-6 p-4 text-sm">
          Create a{" "}
          <Link href="/categories" className="text-accent hover:underline">
            category
          </Link>{" "}
          first, then set its budget here.
        </div>
      ) : (
        <form action={setBudget} className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
          <div className="w-full sm:w-64">
            <label htmlFor="budget-category" className="label">Category</label>
            <select id="budget-category" name="categoryId" required className="field">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-56">
            <label htmlFor="budget-amount" className="label">Budget (FCFA)</label>
            <input
              id="budget-amount"
              name="amount"
              type="number"
              min="1"
              required
              placeholder="e.g. 600000"
              className="field"
            />
          </div>
          <button type="submit" className="btn btn-primary">Set budget</button>
        </form>
      )}

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="num hidden sm:table-cell">Budget (FCFA)</th>
              <th className="num hidden sm:table-cell">Spent (FCFA)</th>
              <th className="sm:min-w-52">Used</th>
              <th className="hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No budgets set for this school year yet.
                </td>
              </tr>
            )}
            {budgets.map((b) => {
              const spent = spentByCategory.get(b.categoryId) ?? 0;
              const { percent, tone, label } = budgetUsage(spent, b.amount);

              return (
                <tr key={b.id}>
                  <td>
                    <span className="font-medium">{b.category.name}</span>
                    {/* on a phone the two amount columns are hidden, so show them here */}
                    <span className="block text-xs tabular-nums text-muted sm:hidden">
                      {fcfa(spent)} of {fcfa(b.amount)}
                    </span>
                  </td>
                  <td className="num hidden sm:table-cell">{fcfa(b.amount)}</td>
                  <td className="num hidden sm:table-cell">{fcfa(spent)}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="grow">
                        <ProgressBar percent={percent} tone={tone} />
                      </div>
                      <span className="w-11 text-right tabular-nums">{percent}%</span>
                    </div>
                    <div className="mt-1.5 sm:hidden">
                      <StatusBadge tone={tone} label={label} />
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <StatusBadge tone={tone} label={label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {budgets.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          The mark on each bar is the 80% warning line.
        </p>
      )}

      {unbudgetedRows.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Spending with no budget</h2>
          <p className="mb-3 text-sm text-muted">
            These categories have expenses but no budget, so nothing warns you about them.
          </p>
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Spent (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                {unbudgetedRows.map((r) => (
                  <tr key={r.categoryId}>
                    <td className="font-medium">
                      {nameById.get(r.categoryId) ?? "Unknown category"}
                    </td>
                    <td className="num">{fcfa(r._sum.amount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
