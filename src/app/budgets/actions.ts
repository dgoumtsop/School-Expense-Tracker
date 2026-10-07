"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function setBudget(formData: FormData) {
  const categoryId = Number(formData.get("categoryId"));
  const amount = Math.round(Number(formData.get("amount")));
  if (!categoryId || !(amount > 0)) return;

  // budgets belong to the active school year
  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!year) return;

  // one budget per category per year, so set it or change it
  await prisma.budget.upsert({
    where: {
      categoryId_schoolYearId: { categoryId, schoolYearId: year.id },
    },
    update: { amount },
    create: { amount, categoryId, schoolYearId: year.id },
  });

  revalidatePath("/budgets");
}