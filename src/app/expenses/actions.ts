"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHODS, type PaymentMethodValue } from "@/lib/payment-methods";

export async function createExpense(formData: FormData) {
  const categoryId = Number(formData.get("categoryId"));
  const accountId = Number(formData.get("accountId"));
  // supplier is optional, empty string means none
  const supplierRaw = String(formData.get("supplierId") ?? "");
  const supplierId = supplierRaw ? Number(supplierRaw) : null;
  const amount = Math.round(Number(formData.get("amount")));
  const date = new Date(String(formData.get("date") ?? ""));
  const description = String(formData.get("description") ?? "").trim() || null;
  const method = String(formData.get("paymentMethod") ?? "");

  // bad input just stops here for now, real error messages come later
  if (!categoryId || !accountId || !(amount > 0) || isNaN(date.getTime())) return;
  if (!PAYMENT_METHODS.some((m) => m.value === method)) return;

  // every expense belongs to the active school year
  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!year) return;

  await prisma.expense.create({
    data: {
      date,
      amount,
      description,
      paymentMethod: method as PaymentMethodValue,
      categoryId,
      accountId,
      supplierId,
      schoolYearId: year.id,
    },
  });

  revalidatePath("/expenses");
}