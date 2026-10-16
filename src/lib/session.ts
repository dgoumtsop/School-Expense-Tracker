import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session-token";

// true when the request carries a valid session cookie
export async function isLoggedIn() {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}