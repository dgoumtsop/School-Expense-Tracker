import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLoggedIn } from "@/lib/session";
import { isoDate } from "@/lib/format";
import { buildReport, readReportParams, toCsv } from "@/lib/reports";

// the report on screen as a CSV file, same url parameters as /reports
export async function GET(request: NextRequest) {
  // route handlers are reachable directly, so check the session here too
  if (!(await isLoggedIn())) return new Response("Sign in first.", { status: 401 });

  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!year) return new Response("No active school year.", { status: 404 });

  const params = request.nextUrl.searchParams;
  const input = readReportParams((k) => params.get(k) ?? undefined, year.name);
  const { table } = await buildReport(year.id, input);

  const name = `expenses-${input.view}-${isoDate(input.from)}-to-${isoDate(input.to)}.csv`;
  return new Response(toCsv(table), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
