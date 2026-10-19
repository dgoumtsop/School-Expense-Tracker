import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { isoDate } from "@/lib/format";
import { updateExpense } from "../../actions";
import { ExpenseForm } from "../../expense-form";

export const dynamic = "force-dynamic";

// in next 16 the route params arrive as a promise
export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id: Number(id) } });
  if (!expense || expense.status === "CANCELLED") notFound();

  // keep the expense's own category, account and supplier in the lists even if they were
  // archived since, otherwise the select falls back to the first option and saving changes it
  const keep = (id: number | null) =>
    id ? { OR: [{ isArchived: false }, { id }] } : { isArchived: false };
  const label = (rows: { id: number; name: string; isArchived: boolean }[]) =>
    rows.map((r) => ({ id: r.id, name: r.isArchived ? `${r.name} (archived)` : r.name }));

  const [categories, accounts, suppliers] = await Promise.all([
    prisma.category.findMany({ where: keep(expense.categoryId), orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: keep(expense.accountId), orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: keep(expense.supplierId), orderBy: { name: "asc" } }),
  ]).then((lists) => lists.map(label));

  return (
    <>
      <Link href="/expenses" className="mb-4 inline-block text-sm text-accent hover:underline">
        Back to expenses
      </Link>
      <PageHeader
        title="Edit expense"
        description="Changes apply to the budget totals right away."
      />
      <div className="max-w-3xl">
        <ExpenseForm
          action={updateExpense}
          categories={categories}
          accounts={accounts}
          suppliers={suppliers}
          submitLabel="Save changes"
          initial={{
            id: expense.id,
            date: isoDate(expense.date),
            amount: expense.amount,
            categoryId: expense.categoryId,
            accountId: expense.accountId,
            supplierId: expense.supplierId,
            paymentMethod: expense.paymentMethod,
            description: expense.description,
          }}
        />
      </div>
    </>
  );
}
