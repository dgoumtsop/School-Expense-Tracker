import Link from "next/link";
import { createCategory, archiveCategory } from "./actions";
import { prisma } from "@/lib/prisma";
import { createCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // archived ones stay in the db but don't show in the list
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-8">
      <Link href="/" className="underline block mb-4">← Home</Link>
      <h1 className="text-2xl font-bold mb-4">Categories</h1>

      <form action={createCategory} className="flex gap-2 mb-6">
        <input
          name="name"
          required
          placeholder="New category name"
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="border rounded px-3 py-1">
          Add
        </button>
      </form>

   <ul className="space-y-1">
  {categories.map((c) => (
    <li key={c.id} className="flex items-center gap-3">
      <span>{c.name}</span>
      <form action={archiveCategory}>
        <input type="hidden" name="id" value={c.id} />
        <button type="submit" className="text-sm underline">
          Archive
        </button>
      </form>
    </li>
  ))}
</ul>
    </main>
  );
}