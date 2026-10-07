import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setBudget } from "./actions";

// always read fresh data from the db, don't cache this page at build time
export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const budgets = await prisma.budget.findMany({
    where: { schoolYear: { isActive: true } },
    include: { category: true, schoolYear: true },
    orderBy: { amount: "desc" },
  });

  // categories for the dropdown, archived ones stay out
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-8">
      <Link href="/" className="underline block mb-4">← Home</Link>
      <h1 className="text-2xl font-bold mb-4">
        Budgets {budgets[0]?.schoolYear.name}
      </h1>

      <form action={setBudget} className="flex gap-2 mb-6">
        <select name="categoryId" required className="border rounded px-2 py-1">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          name="amount"
          type="number"
          min="1"
          required
          placeholder="Amount (FCFA)"
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="border rounded px-3 py-1">
          Set budget
        </button>
      </form>

      <ul className="space-y-2">
        {budgets.map((b) => (
          <li key={b.id}>
            {b.category.name}: {b.amount.toLocaleString("en-US")} FCFA
          </li>
        ))}
      </ul>
    </main>
  );
}