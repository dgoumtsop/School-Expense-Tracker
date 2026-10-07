import { prisma } from "@/lib/prisma";

// always read fresh data from the db, don't cache this page at build time
export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const budgets = await prisma.budget.findMany({
    where: { schoolYear: { isActive: true } },
    include: { category: true, schoolYear: true },
    orderBy: { amount: "desc" },
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Budgets {budgets[0]?.schoolYear.name}
      </h1>
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