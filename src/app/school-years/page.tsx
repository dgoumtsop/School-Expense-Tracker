import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSchoolYear, setActiveYear } from "./actions";

export const dynamic = "force-dynamic";

export default async function SchoolYearsPage() {
  const years = await prisma.schoolYear.findMany({ orderBy: { name: "desc" } });

  return (
    <main className="p-8">
      <Link href="/" className="underline block mb-4">← Home</Link>
      <h1 className="text-2xl font-bold mb-4">School years</h1>

      <form action={createSchoolYear} className="flex gap-2 mb-6">
        <input
          name="name"
          required
          placeholder="e.g. 2027-2028"
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="border rounded px-3 py-1">
          Add
        </button>
      </form>

      <ul className="space-y-1">
        {years.map((y) => (
          <li key={y.id} className="flex items-center gap-3">
            <span>{y.name}</span>
            {y.isActive ? (
              <span className="text-sm font-semibold">Active</span>
            ) : (
              <form action={setActiveYear}>
                <input type="hidden" name="id" value={y.id} />
                <button type="submit" className="text-sm underline">
                  Make active
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}