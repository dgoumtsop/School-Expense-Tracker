import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
      include: { category: true, account: true },
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
    <main className="p-8">
      <Link href="/" className="underline block mb-4">← Home</Link>
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>

      {missingSetup ? (
        <p className="mb-6">
          Add at least one <Link href="/categories" className="underline">category</Link> and
          one <Link href="/accounts" className="underline">account</Link> first.
        </p>
      ) : (
        <ExpenseForm
          action={createExpense}
          categories={formCategories}
          accounts={accounts}
          suppliers={suppliers}
          submitLabel="Add expense"
        />
      )}

      <h2 className="text-xl font-semibold mb-2">History</h2>

      <form method="get" className="flex flex-wrap items-end gap-2 mb-4">
        <label className="grid text-sm">
          From
          <input name="from" type="date" defaultValue={from} className="border rounded px-2 py-1" />
        </label>
        <label className="grid text-sm">
          To
          <input name="to" type="date" defaultValue={to} className="border rounded px-2 py-1" />
        </label>
        <label className="grid text-sm">
          Category
          <select name="category" defaultValue={categoryId || ""} className="border rounded px-2 py-1">
            <option value="">All</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="grid text-sm">
          Payment method
          <select name="method" defaultValue={validMethod ? method : ""} className="border rounded px-2 py-1">
            <option value="">All</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="grid text-sm">
          Status
          <select name="status" defaultValue={status} className="border rounded px-2 py-1">
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All</option>
          </select>
        </label>
        <button type="submit" className="border rounded px-3 py-1">Filter</button>
        {filtered && (
          <Link href="/expenses" className="underline text-sm py-1">Clear</Link>
        )}
      </form>

      <p className="text-sm mb-3">
        {totals._count} expense{totals._count === 1 ? "" : "s"} ·{" "}
        {(totals._sum.amount ?? 0).toLocaleString("en-US")} FCFA
        {totals._count > expenses.length ? ` (showing the latest ${expenses.length})` : ""}
      </p>

      {expenses.length === 0 ? (
        <p>{filtered ? "No expenses match these filters." : "No expenses yet."}</p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((e) => {
            const cancelled = e.status === "CANCELLED";
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span className={cancelled ? "line-through text-gray-500" : ""}>
                  {e.date.toISOString().slice(0, 10)} · {e.category.name} ·{" "}
                  {e.amount.toLocaleString("en-US")} FCFA · {e.account.name}
                  {e.description ? ` · ${e.description}` : ""}
                </span>
                {cancelled ? (
                  <span className="text-sm text-gray-500">
                    Cancelled {e.cancelledAt?.toISOString().slice(0, 10)}
                  </span>
                ) : (
                  <>
                    <Link href={`/expenses/${e.id}/edit`} className="text-sm underline">
                      Edit
                    </Link>
                    <form action={cancelExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-sm underline text-red-600">
                        Cancel
                      </button>
                    </form>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
