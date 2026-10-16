import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ProgressBar, StatusBadge } from "@/components/budget-meter";
import { BudgetRing } from "@/components/budget-ring";
import { SpendingChart, type SpendingPoint } from "@/components/spending-chart";
import { budgetUsage } from "@/lib/budget-status";
import { monthWindow } from "@/lib/budget";
import { fcfa, isoDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });

  // nothing to summarize until a year is active
  if (!year) {
    return (
      <>
        <PageHeader title="Overview" />
        <div className="panel p-6">
          <p className="font-medium">No school year is active yet.</p>
          <p className="mt-1 text-sm text-muted">
            Budgets and expenses belong to a school year, so start by choosing one.
          </p>
          <Link href="/school-years" className="btn btn-primary mt-4">
            Set up a school year
          </Link>
        </div>
      </>
    );
  }

  // monthly budgets are checked against the current month only
  const now = new Date();
  const { start, end } = monthWindow(now);
  const monthName = now.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

  const [budgets, spentRows, recent, dated, categories, monthRows] = await Promise.all([
    prisma.budget.findMany({
      where: { schoolYearId: year.id },
      include: { category: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE", schoolYearId: year.id },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { status: "ACTIVE", schoolYearId: year.id },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    // every active expense, only date and amount, to build the month by month chart
    prisma.expense.findMany({
      where: { status: "ACTIVE", schoolYearId: year.id },
      select: { date: true, amount: true },
      orderBy: { date: "asc" },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE", schoolYearId: year.id, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const spentByCategory = new Map(
    spentRows.map((r) => [r.categoryId, r._sum.amount ?? 0])
  );

  const spentThisMonth = new Map(
    monthRows.map((r) => [r.categoryId, r._sum.amount ?? 0])
  );

  // a monthly budget counts as 12 months in the year's total
  const budgeted = budgets.reduce(
    (sum, b) => sum + (b.period === "MONTHLY" ? b.amount * 12 : b.amount),
    0
  );
  // remaining only compares budgets with what was spent in those same categories
  const spentInBudgets = budgets.reduce(
    (sum, b) => sum + (spentByCategory.get(b.categoryId) ?? 0),
    0
  );
  const spentTotal = spentRows.reduce((sum, r) => sum + (r._sum.amount ?? 0), 0);
  const spentOutsideBudgets = spentTotal - spentInBudgets;
  const remaining = budgeted - spentInBudgets;

  // categories at 80% or more, closest to the limit first
  const attention = budgets
    .map((b) => {
      const monthly = b.period === "MONTHLY";
      // monthly budgets are judged on this month, yearly ones on the whole year
      const spent = (monthly ? spentThisMonth : spentByCategory).get(b.categoryId) ?? 0;
      return { b, monthly, spent, ...budgetUsage(spent, b.amount) };
    })
    .filter((x) => x.tone !== "ok")
    .sort((a, z) => z.percent - a.percent);

  // total per month, then a running total, filling months with no spending so the line is honest
  const monthKey = (d: Date) => d.toISOString().slice(0, 7);
  const byMonth = new Map<string, number>();
  for (const e of dated) {
    byMonth.set(monthKey(e.date), (byMonth.get(monthKey(e.date)) ?? 0) + e.amount);
  }
  const points: SpendingPoint[] = [];
  if (dated.length > 0) {
    // the school year name looks like "2026-2027", assume it runs September to August
    const startYear = Number(year.name.slice(0, 4)) || dated[0].date.getUTCFullYear();
    const lastDate = dated[dated.length - 1].date;
    const monthIndex = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();
    const startIdx = Math.min(startYear * 12 + 8, monthIndex(dated[0].date));
    const endIdx = Math.max((startYear + 1) * 12 + 7, monthIndex(lastDate));
    const lastIdx = monthIndex(lastDate);

    let running = 0;
    for (let i = startIdx; i <= endIdx; i++) {
      const d = new Date(Date.UTC(Math.floor(i / 12), i % 12, 1));
      const total = byMonth.get(monthKey(d)) ?? 0;
      running += total;
      points.push({
        label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        total,
        cumulative: running,
        future: i > lastIdx,
      });
    }
  }

  // biggest spending categories, budgeted or not
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const topCategories = spentRows
    .map((r) => ({ id: r.categoryId, name: nameById.get(r.categoryId) ?? "Unknown", spent: r._sum.amount ?? 0 }))
    .sort((a, z) => z.spent - a.spent)
    .slice(0, 5);

  const overall = budgetUsage(spentInBudgets, budgeted);

  const figures = [
    { label: "Budgeted", value: budgeted, danger: false },
    { label: "Spent", value: spentTotal, danger: false },
    { label: "Remaining", value: remaining, danger: remaining < 0 },
  ];

  return (
    <>
      <PageHeader title="Overview" description={`School year ${year.name}`} />

      <div className="panel flex flex-col items-center gap-6 p-6 sm:flex-row sm:gap-10">
        <BudgetRing
          percent={overall.percent}
          tone={overall.tone}
          caption={remaining >= 0 ? "of the budget used" : "over the budget"}
        />
        <div className="grid w-full gap-5 sm:grid-cols-3">
          {figures.map((f) => (
            <div key={f.label}>
              <p className="text-sm text-muted">{f.label}</p>
              <p
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  f.danger ? "text-red-700" : ""
                }`}
              >
                {fcfa(f.value)}
              </p>
              <p className="text-xs text-muted">FCFA</p>
            </div>
          ))}
        </div>
      </div>
      {spentOutsideBudgets > 0 && (
        <p className="mt-2 text-sm text-muted">
          {fcfa(spentOutsideBudgets)} FCFA was spent in categories with no budget.{" "}
          <Link href="/budgets" className="text-accent hover:underline">
            Set a budget
          </Link>
        </p>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Spending over time</h2>
        <div className="panel p-4 sm:p-5">
          {points.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              The chart appears once you record the first expense.
            </p>
          ) : (
            <>
              {/* on a phone the chart keeps a readable width and scrolls sideways */}
              <div className="overflow-x-auto">
                <div className="min-w-[540px]">
                  <SpendingChart points={points} budget={budgeted} />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">
                Running total of expenses by month across the school year. Stay under the dashed line to stay within the budget.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Close to the limit</h2>
          {attention.length === 0 ? (
            <div className="panel p-5 text-sm text-muted">
              No category is at 80% of its budget yet.
            </div>
          ) : (
            <div className="panel divide-y divide-line">
              {attention.map(({ b, monthly, spent, percent, tone, label }) => (
                <div key={b.id} className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{b.category.name}</p>
                    <StatusBadge tone={tone} label={label} />
                  </div>
                  <p className="mb-2 text-sm tabular-nums text-muted">
                    {fcfa(spent)} of {fcfa(b.amount)} FCFA{" "}
                    {monthly ? `per month, in ${monthName}` : ""} ({percent}%)
                  </p>
                  <ProgressBar percent={percent} tone={tone} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Where the money went</h2>
          {topCategories.length === 0 ? (
            <div className="panel p-5 text-sm text-muted">No spending recorded yet.</div>
          ) : (
            <div className="panel divide-y divide-line">
              {topCategories.map((c) => {
                const share = spentTotal > 0 ? Math.round((c.spent / spentTotal) * 100) : 0;
                return (
                  <div key={c.id} className="p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="shrink-0 whitespace-nowrap text-sm tabular-nums">{fcfa(c.spent)} FCFA</p>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 grow rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm tabular-nums text-muted">{share}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Latest expenses</h2>
          <Link href="/expenses" className="text-sm text-accent hover:underline">
            See all expenses
          </Link>
        </div>
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th className="hidden sm:table-cell">Description</th>
                <th className="num">Amount (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    No expenses yet. They show up here as soon as you add one.
                  </td>
                </tr>
              )}
              {recent.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap tabular-nums">{isoDate(e.date)}</td>
                  <td>
                    {e.category.name}
                    {/* the description column is hidden on phones, so it moves under the category */}
                    {e.description && (
                      <span className="block text-xs text-muted sm:hidden">{e.description}</span>
                    )}
                  </td>
                  <td className="hidden text-muted sm:table-cell">{e.description ?? "-"}</td>
                  <td className="num">{fcfa(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}