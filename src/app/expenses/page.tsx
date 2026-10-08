import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { createExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [categories, accounts, suppliers, expenses] = await Promise.all([
    prisma.category.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      where: { status: "ACTIVE", schoolYear: { isActive: true } },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  const missingSetup = categories.length === 0 || accounts.length === 0;

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
        <form action={createExpense} className="grid gap-2 max-w-md mb-8">
          <input name="date" type="date" required className="border rounded px-2 py-1" />
          <input
            name="amount"
            type="number"
            min="1"
            required
            placeholder="Amount (FCFA)"
            className="border rounded px-2 py-1"
          />
          <select name="categoryId" required className="border rounded px-2 py-1">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="accountId" required className="border rounded px-2 py-1">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select name="paymentMethod" required className="border rounded px-2 py-1">
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select name="supplierId" className="border rounded px-2 py-1">
            <option value="">No supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            name="description"
            placeholder="Description (optional)"
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="border rounded px-3 py-1">Add expense</button>
        </form>
      )}

      <ul className="space-y-1">
        {expenses.map((e) => (
          <li key={e.id}>
            {e.date.toISOString().slice(0, 10)} · {e.category.name} ·{" "}
            {e.amount.toLocaleString("en-US")} FCFA · {e.account.name}
            {e.description ? ` · ${e.description}` : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}