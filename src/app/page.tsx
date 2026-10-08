import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">School Expense Manager</h1>
      <nav className="flex flex-col gap-2">
        <Link href="/school-years" className="underline">School years</Link>
        <Link href="/categories" className="underline">Categories</Link>
        <Link href="/budgets" className="underline">Budgets</Link>
        <Link href="/accounts" className="underline">Accounts</Link>
        <Link href="/expenses" className="underline">Expenses</Link>
      </nav>
    </main>
  );
}