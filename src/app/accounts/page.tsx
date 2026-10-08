import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createAccount, archiveAccount } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-8">
      <Link href="/" className="underline block mb-4">← Home</Link>
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>

      <form action={createAccount} className="flex gap-2 mb-6">
        <input
          name="name"
          required
          placeholder="e.g. Main cash box"
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="border rounded px-3 py-1">
          Add
        </button>
      </form>

      <ul className="space-y-1">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center gap-3">
            <span>{a.name}</span>
            <form action={archiveAccount}>
              <input type="hidden" name="id" value={a.id} />
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