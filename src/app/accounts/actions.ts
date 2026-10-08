"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  // name is unique, so skip if it's already there
  const existing = await prisma.account.findUnique({ where: { name } });
  if (!existing) {
    await prisma.account.create({ data: { name } });
  }

  revalidatePath("/accounts");
}

export async function archiveAccount(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  // keep the row so old expenses still point at it
  await prisma.account.update({
    where: { id },
    data: { isArchived: true },
  });

  revalidatePath("/accounts");
}