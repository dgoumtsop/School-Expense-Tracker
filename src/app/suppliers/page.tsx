import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { createSupplier, archiveSupplier } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Regular providers, such as bookshops, energy companies or craftsmen. A supplier is optional on an expense."
      />

      <form action={createSupplier} className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="w-full sm:w-72">
          <label htmlFor="supplier-name" className="label">New supplier</label>
          <input
            id="supplier-name"
            name="name"
            required
            placeholder="e.g. City Bookshop"
            className="field"
          />
        </div>
        <button type="submit" className="btn btn-primary">Add supplier</button>
      </form>

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="w-px"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={2} className="py-8 text-center text-muted">
                  No suppliers yet. Add the first one above.
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td className="text-right">
                  <form action={archiveSupplier}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Archive
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
