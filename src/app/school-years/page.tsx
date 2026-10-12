import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { createSchoolYear, setActiveYear } from "./actions";

export const dynamic = "force-dynamic";

export default async function SchoolYearsPage() {
  const years = await prisma.schoolYear.findMany({ orderBy: { name: "desc" } });

  return (
    <>
      <PageHeader
        title="School years"
        description="Budgets and expenses belong to the active school year. Only one year is active at a time, and switching never deletes anything."
      />

      <form action={createSchoolYear} className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="w-full sm:w-64">
          <label htmlFor="year-name" className="label">New school year</label>
          <input
            id="year-name"
            name="name"
            required
            placeholder="e.g. 2027-2028"
            className="field"
          />
        </div>
        <button type="submit" className="btn btn-primary">Add school year</button>
      </form>

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>School year</th>
              <th>Status</th>
              <th className="w-px"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted">
                  No school years yet. Add the first one above.
                </td>
              </tr>
            )}
            {years.map((y) => (
              <tr key={y.id}>
                <td className="font-medium">{y.name}</td>
                <td>
                  {y.isActive ? (
                    <span className="badge bg-indigo-50 text-indigo-800">Active</span>
                  ) : (
                    <span className="text-muted">Inactive</span>
                  )}
                </td>
                <td className="text-right">
                  {!y.isActive && (
                    <form action={setActiveYear}>
                      <input type="hidden" name="id" value={y.id} />
                      <button type="submit" className="btn btn-secondary btn-sm">
                        Make active
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
