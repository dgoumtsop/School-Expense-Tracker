import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { fcfa, isoDate } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethodValue } from "@/lib/payment-methods";
import { cancelExpense, createExpense } from "./actions";
import { ExpenseForm } from "./expense-form";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

// query params can come as arrays, so take the first string
function pick(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// a date string from the url, or null if it's empty or garbage
function toDate(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const methodLabel = (value: string) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;

export default async function ExpensesPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const from = pick(sp.from);
  const to = pick(sp.to);
  const categoryId = Number(pick(sp.category)) || 0;
  const method = pick(sp.method);
  const status = pick(sp.status) || "active";

  const fromDate = toDate(from);
  const toDay = toDate(to);
  const validMethod = PAYMENT_METHODS.some((m) => m.value === method);

  // build the filter piece by piece, only adding what the user picked
  const where = {
    schoolYear: { isActive: true },
    ...(status === "cancelled"
      ? { status: "CANCELLED" as const }
      : status === "all"
        ? {}
        : { status: "ACTIVE" as const }),
    ...(categoryId ? { categoryId } : {}),
    ...(validMethod ? { paymentMethod: method as PaymentMethodValue } : {}),
    ...(fromDate || toDay
      ? {
          date: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDay ? { lte: toDay } : {}),
          },
        }
      : {}),
  };

  const [allCategories, accounts, suppliers, expenses, totals] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      where,
      include: { category: true, account: true, supplier: true },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
  ]);

  // the form only offers categories that aren't archived, the filter offers all
  const formCategories = allCategories.filter((c) => !c.isArchived);
  const missingSetup = formCategories.length === 0 || accounts.length === 0;
  const filtered = Boolean(from || to || categoryId || validMethod || status !== "active");

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Record money going out, then look back through the history."
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Add an expense</h2>
        {missingSetup ? (
          <div className="panel p-4 text-sm">
            Add at least one{" "}
            <Link href="/categories" className="text-accent hover:underline">category</Link>{" "}
            and one{" "}
            <Link href="/accounts" className="text-accent hover:underline">account</Link>{" "}
            before recording an expense.
          </div>
        ) : (
          <ExpenseForm
            action={createExpense}
            categories={formCategories}
            accounts={accounts}
            suppliers={suppliers}
            submitLabel="Add expense"
          />
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">History</h2>

        <form
          method="get"
          className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div>
            <label htmlFor="f-from" className="label">From</label>
            <input id="f-from" name="from" type="date" defaultValue={from} className="field" />
          </div>
          <div>
            <label htmlFor="f-to" className="label">To</label>
            <input id="f-to" name="to" type="date" defaultValue={to} className="field" />
          </div>
          <div>
            <label htmlFor="f-category" className="label">Category</label>
            <select
              id="f-category"
              name="category"
              defaultValue={categoryId || ""}
              className="field"
            >
              <option value="">All</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-method" className="label">Payment method</label>
            <select
              id="f-method"
              name="method"
              defaultValue={validMethod ? method : ""}
              className="field"
            >
              <option value="">All</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-status" className="label">Status</label>
            <select id="f-status" name="status" defaultValue={status} className="field">
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-5">
            <button type="submit" className="btn btn-primary">Apply filters</button>
            {filtered && (
              <Link href="/expenses" className="text-sm text-accent hover:underline">
                Clear filters
              </Link>
            )}
          </div>
        </form>

        <p className="mb-3 text-sm text-muted">
          {totals._count} expense{totals._count === 1 ? "" : "s"} totaling{" "}
          <span className="font-medium tabular-nums text-ink">
            {fcfa(totals._sum.amount ?? 0)} FCFA
          </span>
          {totals._count > expenses.length
            ? `. Showing the latest ${expenses.length}.`
            : "."}
        </p>

        <div className="panel overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Details</th>
                <th>Paid with</th>
                <th className="num">Amount (FCFA)</th>
                <th className="w-px"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    {filtered
                      ? "No expenses match these filters. Try widening the dates or clearing a filter."
                      : "No expenses yet. Add the first one above."}
                  </td>
                </tr>
              )}
              {expenses.map((e) => {
                const cancelled = e.status === "CANCELLED";
                return (
                  <tr key={e.id} className={cancelled ? "text-muted" : ""}>
                    <td className="whitespace-nowrap tabular-nums">{isoDate(e.date)}</td>
                    <td className="font-medium">{e.category.name}</td>
                    <td>
                      <span>{e.description ?? "-"}</span>
                      {e.supplier && (
                        <span className="block text-xs text-muted">{e.supplier.name}</span>
                      )}
                    </td>
                    <td>
                      <span>{e.account.name}</span>
                      <span className="block text-xs text-muted">
                        {methodLabel(e.paymentMethod)}
                      </span>
                    </td>
                    <td className={`num ${cancelled ? "line-through" : ""}`}>
                      {fcfa(e.amount)}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {cancelled ? (
                        <span className="badge bg-paper text-muted">
                          Cancelled {e.cancelledAt ? isoDate(e.cancelledAt) : ""}
                        </span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/expenses/${e.id}/edit`}
                            className="btn btn-secondary btn-sm"
                          >
                            Edit
                          </Link>
                          <form action={cancelExpense}>
                            <input type="hidden" name="id" value={e.id} />
                            <button type="submit" className="btn btn-danger btn-sm">
                              Cancel
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
