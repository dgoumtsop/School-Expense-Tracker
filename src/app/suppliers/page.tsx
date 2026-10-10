import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSupplier, archiveSupplier } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-8">
      <Link href="/" className="underline block mb-4">← Home</Link>
      <h1 className="text-2xl font-bold mb-4">Suppliers</h1>

      <form action={createSupplier} className="flex gap-2 mb-6">
        <input
          name="name"
          required
          placeholder="e.g. City Bookshop"
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="border rounded px-3 py-1">
          Add
        </button>
      </form>

      <ul className="space-y-1">
        {suppliers.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            <span>{s.name}</span>
            <form action={archiveSupplier}>
              <input type="hidden" name="id" value={s.id} />
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