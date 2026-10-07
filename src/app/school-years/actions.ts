"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createSchoolYear(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const existing = await prisma.schoolYear.findUnique({ where: { name } });
  if (!existing) {
    await prisma.schoolYear.create({ data: { name } });
  }

  revalidatePath("/school-years");
}

export async function setActiveYear(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  // only one year can be active, so turn all off and the chosen one on, together
  await prisma.$transaction([
    prisma.schoolYear.updateMany({ data: { isActive: false } }),
    prisma.schoolYear.update({ where: { id }, data: { isActive: true } }),
  ]);

  revalidatePath("/school-years");
  revalidatePath("/budgets");
}