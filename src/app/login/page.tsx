import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // already signed in, nothing to do here
  if (await isLoggedIn()) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="text-2xl font-semibold tracking-tight">School Expense Manager</h1>
      <p className="mt-1 text-sm text-muted">Enter the password to continue.</p>
      <LoginForm />
    </main>
  );
}