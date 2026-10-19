import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/budget-meter";
import { fcfa, isoDate } from "@/lib/format";
import { GROUPINGS, REPORT_VIEWS, buildReport, readReportParams } from "@/lib/reports";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const longDate = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ReportsPage({ searchParams }: { searchParams: Search }) {
  const year = await prisma.schoolYear.findFirst({ where: { isActive: true } });

  if (!year) {
    return (
      <>
        <PageHeader title="Reports" />
        <div className="panel p-6">
          <p className="font-medium">No school year is active yet.</p>
          <p className="mt-1 text-sm text-muted">Reports cover the active school year.</p>
          <Link href="/school-years" className="btn btn-primary mt-4">
            Set up a school year
          </Link>
        </div>
      </>
    );
  }

  const sp = await searchParams;
  const input = readReportParams((k) => pick(sp[k]), year.name);
  const { view, grouping, from, to } = input;
  const { summary, table } = await buildReport(year.id, input);

  // links and the export keep the same range and grouping
  const query = (patch: Record<string, string>) =>
    new URLSearchParams({ view, group: grouping, from: isoDate(from), to: isoDate(to), ...patch }).toString();
  const viewLabel = REPORT_VIEWS.find((v) => v.value === view)!.label;
  const groupLabel = GROUPINGS.find((g) => g.value === grouping)!.label;
  const title = view === "period" ? `${groupLabel} statement` : `Statement ${viewLabel.toLowerCase()}`;
  const statusColumn = view === "budget" ? table.columns.length - 1 : -1;

  const figures = [
    { label: "Total spent", value: `${fcfa(summary.total)}`, unit: "FCFA" },
    { label: "Expenses", value: String(summary.count), unit: summary.count === 1 ? "entry" : "entries" },
    { label: "Average expense", value: fcfa(summary.average), unit: "FCFA" },
  ];

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Reports"
          description={`Statements for school year ${year.name}. Cancelled expenses are left out.`}
        >
          <div className="flex gap-2">
            <a href={`/reports/export?${query({})}`} className="btn btn-primary">
              Export CSV
            </a>
            <PrintButton />
          </div>
        </PageHeader>

        <nav aria-label="Report type" className="mb-4 flex flex-wrap gap-2">
          {REPORT_VIEWS.map((v) => (
            <Link
              key={v.value}
              href={`/reports?${query({ view: v.value })}`}
              aria-current={v.value === view ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                v.value === view
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line bg-surface text-muted hover:border-accent/50 hover:text-ink"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </nav>

        <form method="get" className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
          <input type="hidden" name="view" value={view} />
          <div className="w-full sm:w-44">
            <label htmlFor="r-from" className="label">From</label>
            <input id="r-from" name="from" type="date" defaultValue={isoDate(from)} className="field" />
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="r-to" className="label">To</label>
            <input id="r-to" name="to" type="date" defaultValue={isoDate(to)} className="field" />
          </div>
          {view === "period" ? (
            <div className="w-full sm:w-40">
              <label htmlFor="r-group" className="label">Group by</label>
              <select id="r-group" name="group" defaultValue={grouping} className="field">
                {GROUPINGS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="group" value={grouping} />
          )}
          <button type="submit" className="btn btn-primary">Update report</button>
          <Link href={`/reports?view=${view}`} className="text-sm font-medium text-accent hover:underline">
            Whole school year
          </Link>
        </form>
      </div>

      {/* what a printed statement opens with */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
          School year {year.name}
        </p>
        <h2 className="mt-1 text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          {longDate(from)} to {longDate(to)}
          <span className="hidden print:inline"> · printed {longDate(new Date())}</span>
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {figures.map((f) => (
          <div key={f.label} className="panel p-5">
            <p className="text-sm text-muted">{f.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{f.value}</p>
            <p className="text-xs text-muted">{f.unit}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c.label} className={c.numeric ? "num" : ""}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length} className="py-10 text-center text-muted">
                  {view === "budget"
                    ? "No budgets or expenses in this range yet."
                    : "No expenses in this range. Try a wider date range."}
                </td>
              </tr>
            )}
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.cells.map((cell, j) => {
                  const col = table.columns[j];
                  if (j === statusColumn && row.tone) {
                    return (
                      <td key={j}>
                        <StatusBadge tone={row.tone} label={String(cell)} />
                      </td>
                    );
                  }
                  const negative = typeof cell === "number" && cell < 0;
                  return (
                    <td
                      key={j}
                      className={`${col.numeric ? "num" : ""} ${j === 0 ? "font-medium" : ""} ${
                        negative ? "text-bad-ink" : ""
                      }`}
                    >
                      {typeof cell === "number" && col.label.includes("FCFA") ? fcfa(cell) : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {table.totals && (
            <tfoot>
              <tr className="bg-paper/70 font-bold">
                {table.totals.map((cell, j) => {
                  const col = table.columns[j];
                  return (
                    <td key={j} className={`border-t border-line px-4 py-3.5 ${col.numeric ? "num" : ""}`}>
                      {typeof cell === "number" && col.label.includes("FCFA") ? fcfa(cell) : cell}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {view === "budget" && table.rows.length > 0 && (
        <p className="mt-2 text-sm text-muted print:hidden">
          A monthly budget counts once for each month the range touches.
        </p>
      )}
    </>
  );
}
