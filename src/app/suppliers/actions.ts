"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/session";

export async function createSupplier(formData: FormData) {
  await requireLogin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const existing = await prisma.supplier.findUnique({ where: { name } });
  if (!existing) {
    await prisma.supplier.create({ data: { name } });
  }

  revalidatePath("/suppliers");
}

export async function archiveSupplier(formData: FormData) {
  await requireLogin();
  const id = Number(formData.get("id"));
  if (!id) return;

  await prisma.supplier.update({
    where: { id },
    data: { isArchived: true },
  });

  revalidatePath("/suppliers");
}