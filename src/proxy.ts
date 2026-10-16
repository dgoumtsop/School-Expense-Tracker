import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session-token";

// runs before every page, anyone without a valid session goes to the login page
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();

  if (await verifyToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

// everything except Next's own static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};