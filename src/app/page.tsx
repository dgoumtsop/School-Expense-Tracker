import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">School Expense Manager</h1>
      <Link href="/" className="underline block mb-4">← Home</Link>
      <nav className="flex flex-col gap-2">
        <Link href="/budgets" className="underline">Budgets</Link>
        <Link href="/categories" className="underline">Categories</Link>
      </nav>
    </main>
  );
}