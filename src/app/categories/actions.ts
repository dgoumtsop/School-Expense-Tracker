  "use server";

  import { revalidatePath } from "next/cache";
  import { prisma } from "@/lib/prisma";

  export async function createCategory(formData: FormData) {
    // form values come in as strings or null, so clean it up first
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;

    // skip if it already exists, name is unique in the db
    const existing = await prisma.category.findUnique({ where: { name } });
    if (!existing) {
      await prisma.category.create({ data: { name } });
    }
    
export async function archiveCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  // keep the row so old expenses and budgets still point at something
  await prisma.category.update({
    where: { id },
    data: { isArchived: true },
  });

  revalidatePath("/categories");
}
