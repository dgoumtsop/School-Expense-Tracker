import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setBudget } from "./actions";

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
        {budgets.map((b) => {
          const spent = spentByCategory.get(b.categoryId) ?? 0;
          const percent = Math.round((spent / b.amount) * 100);

          // 80% and up is a warning, 100% and up is over budget
          const color =
            percent >= 100
              ? "text-red-600"
              : percent >= 80
                ? "text-yellow-600"
                : "text-green-700";
          const label =
            percent >= 100 ? "Over budget" : percent >= 80 ? "Warning" : "OK";

          return (
            <li key={b.id}>
              {b.category.name}: {spent.toLocaleString("en-US")} /{" "}
              {b.amount.toLocaleString("en-US")} FCFA{" "}
              <span className={color}>
                ({percent}% · {label})
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}