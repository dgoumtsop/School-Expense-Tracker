"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/session";
import { MAX_AMOUNT, getBudgetImpact } from "@/lib/budget";
import type { FormState } from "@/lib/form-state";
import { PAYMENT_METHODS, type PaymentMethodValue } from "@/lib/payment-methods";

// reads and checks the form, returns either an error message or clean data
function parseExpense(formData: FormData) {
  const categoryId = Number(formData.get("categoryId"));
  const accountId = Number(formData.get("accountId"));
  const supplierRaw = String(formData.get("supplierId") ?? "");
  const supplierId = supplierRaw ? Number(supplierRaw) : null;
  const amount = Math.round(Number(formData.get("amount")));
  const date = new Date(String(formData.get("date") ?? ""));
  const description = String(formData.get("description") ?? "").trim() || null;
  const method = String(formData.get("paymentMethod") ?? "");

  if (isNaN(date.getTime())) return { error: "Pick a valid date." };
  if (!(amount > 0)) return { error: "Amount must be greater than 0." };
  if (amount > MAX_AMOUNT) {
    return { error: `Amount can't be more than ${MAX_AMOUNT.toLocaleString("en-US")} FCFA.` };
  }
  if (!categoryId) return { error: "Choose a category." };
  if (!accountId) return { error: "Choose an account." };
  if (!PAYMENT_METHODS.some((m) => m.value === method)) {
    return { error: "Choose a payment method." };
  }

  return {
    data: {
      date,
      amount,
      description,
      paymentMethod: method as PaymentMethodValue,
      categoryId,
      accountId,
      supplierId,
    },
  };
}

type Impact = {
  budget: number;
  period: "YEARLY" | "MONTHLY";
  spentAfter: number;
  percent: number;
};

// a monthly budget is talked about as monthly, so the message makes sense to the user
function budgetWord(impact: Impact) {
  return impact.period === "MONTHLY" ? "its monthly budget" : "its budget";
}

function overBudgetMessage(impact: Impact) {
  return `This puts the category at ${impact.percent}% of ${budgetWord(impact)} (${impact.spentAfter.toLocaleString("en-US")} of ${impact.budget.toLocaleString("en-US")} FCFA).`;
}

export async function createExpense(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireLogin();
  const parsed = parseExpense(formData);
  if ("error" in parsed) return { error: parsed.error };

  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!year) return { error: "No active school year. Set one first." };

  const impact = await getBudgetImpact(
    parsed.data.categoryId,
    year.id,
    parsed.data.amount,
    parsed.data.date
  );

  // over 100% needs an explicit confirmation from the user
  const confirmed = formData.get("confirm") === "yes";
  if (impact && impact.percent > 100 && !confirmed) {
    return { needsConfirm: true, warning: overBudgetMessage(impact) };
  }

  await prisma.expense.create({
    data: { ...parsed.data, schoolYearId: year.id },
  });

  revalidatePath("/expenses");
  revalidatePath("/budgets");

  // 80% and up is a heads-up after saving
  const heads =
    impact && impact.percent >= 80
      ? ` Heads up: this category is now at ${impact.percent}% of ${budgetWord(impact)}.`
      : "";
  return { success: `Expense added.${heads}` };
}

export async function updateExpense(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireLogin();
  const id = Number(formData.get("id"));
  const existing = id ? await prisma.expense.findUnique({ where: { id } }) : null;
  if (!existing) return { error: "Expense not found." };
  if (existing.status === "CANCELLED") {
    return { error: "A cancelled expense can't be edited." };
  }

  const parsed = parseExpense(formData);
  if ("error" in parsed) return { error: parsed.error };

  const impact = await getBudgetImpact(
    parsed.data.categoryId,
    existing.schoolYearId,
    parsed.data.amount,
    parsed.data.date,
    existing.id
  );

  const confirmed = formData.get("confirm") === "yes";
  if (impact && impact.percent > 100 && !confirmed) {
    return { needsConfirm: true, warning: overBudgetMessage(impact) };
  }

  await prisma.expense.update({ where: { id }, data: parsed.data });

  revalidatePath("/expenses");
  revalidatePath("/budgets");
  redirect("/expenses");
}

export async function cancelExpense(formData: FormData) {
  await requireLogin();
  const id = Number(formData.get("id"));
  if (!id) return;

  // soft delete: the row stays for history, but stops counting toward totals
  // only active ones, so a second click doesn't overwrite the original cancel date
  await prisma.expense.updateMany({
    where: { id, status: "ACTIVE" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  revalidatePath("/expenses");
  revalidatePath("/budgets");
}