import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  const [categories, accounts, suppliers] = await Promise.all([
    prisma.category.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="p-8">
      <Link href="/expenses" className="underline block mb-4">← Expenses</Link>
      <h1 className="text-2xl font-bold mb-4">Edit expense</h1>
      <ExpenseForm
        action={updateExpense}
        categories={categories}
        accounts={accounts}
        suppliers={suppliers}
        submitLabel="Save changes"
        initial={{
          id: expense.id,
          date: expense.date.toISOString().slice(0, 10),
          amount: expense.amount,
          categoryId: expense.categoryId,
          accountId: expense.accountId,
          supplierId: expense.supplierId,
          paymentMethod: expense.paymentMethod,
          description: expense.description,
        }}
      />
    </main>
  );
}
