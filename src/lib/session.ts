import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifyToken } from "@/lib/session-token";

// true when the request carries a valid session cookie
export async function isLoggedIn() {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

// first line of every server action: actions can be called with a direct POST
// (even to /login, which the proxy lets through), so the proxy alone isn't enough
export async function requireLogin() {
  if (!(await isLoggedIn())) redirect("/login");
}