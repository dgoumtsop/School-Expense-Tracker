import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { createCategory, archiveCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // archived ones stay in the db but don't show in the list
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="What the school spends money on. Archiving a category hides it from new expenses, and past expenses keep it."
      />

      <form action={createCategory} className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="w-full sm:w-72">
          <label htmlFor="category-name" className="label">New category</label>
          <input
            id="category-name"
            name="name"
            required
            placeholder="e.g. Office materials"
            className="field"
          />
        </div>
        <button type="submit" className="btn btn-primary">Add category</button>
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
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="py-8 text-center text-muted">
                  No categories yet. Add the first one above.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td className="text-right">
                  <form action={archiveCategory}>
                    <input type="hidden" name="id" value={c.id} />
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
