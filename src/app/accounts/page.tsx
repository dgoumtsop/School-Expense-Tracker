import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { createAccount, archiveAccount } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Where the money comes from, such as the main cash box, the bank account or a mobile money wallet."
      />

      <form action={createAccount} className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="w-full sm:w-72">
          <label htmlFor="account-name" className="label">New account</label>
          <input
            id="account-name"
            name="name"
            required
            placeholder="e.g. Main cash box"
            className="field"
          />
        </div>
        <button type="submit" className="btn btn-primary">Add account</button>
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
            {accounts.length === 0 && (
              <tr>
                <td colSpan={2} className="py-8 text-center text-muted">
                  No accounts yet. Add the first one above.
                </td>
              </tr>
            )}
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.name}</td>
                <td className="text-right">
                  <form action={archiveAccount}>
                    <input type="hidden" name="id" value={a.id} />
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
