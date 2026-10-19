import { prisma } from "@/lib/prisma";
import { budgetUsage, type BudgetTone } from "@/lib/budget-status";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { isoDate } from "@/lib/format";

export const REPORT_VIEWS = [
  { value: "period", label: "By period" },
  { value: "category", label: "By category" },
  { value: "method", label: "By payment method" },
  { value: "budget", label: "Budget vs actual" },
] as const;
export type ReportView = (typeof REPORT_VIEWS)[number]["value"];

export const GROUPINGS = [
  { value: "day", label: "Daily" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
] as const;
export type Grouping = (typeof GROUPINGS)[number]["value"];

// one table the page renders and the CSV export writes out as is
export type ReportColumn = { label: string; numeric?: boolean };
export type ReportRow = { cells: (string | number)[]; tone?: BudgetTone };
export type ReportTable = {
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: (string | number)[] | null;
};

export type ReportInput = {
  view: ReportView;
  grouping: Grouping;
  from: Date; // first day, UTC midnight
  to: Date; // last day, included
};

// the school year name looks like "2026-2027": assume September 1 to August 31, like the overview
export function schoolYearRange(name: string) {
  const start = Number(name.slice(0, 4)) || new Date().getUTCFullYear();
  return { from: new Date(Date.UTC(start, 8, 1)), to: new Date(Date.UTC(start + 1, 7, 31)) };
}

// "2026-10-19" -> Date at UTC midnight, like the dates the expense form saves
export function parseDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

// the url's view, grouping and dates, falling back to the whole school year
export function readReportParams(
  get: (key: string) => string | undefined,
  yearName: string
): ReportInput {
  const view = REPORT_VIEWS.find((v) => v.value === get("view"))?.value ?? "period";
  const grouping = GROUPINGS.find((g) => g.value === get("group"))?.value ?? "month";
  const year = schoolYearRange(yearName);
  let from = parseDay(get("from")) ?? year.from;
  let to = parseDay(get("to")) ?? year.to;
  if (from > to) [from, to] = [to, from];
  return { view, grouping, from, to };
}

// how many calendar months the range touches, so a monthly budget can be scaled to it
function monthsCovered(from: Date, to: Date) {
  const index = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();
  return Math.max(1, index(to) - index(from) + 1);
}

function periodKey(date: Date, grouping: Grouping) {
  const iso = isoDate(date);
  return grouping === "day" ? iso : grouping === "month" ? iso.slice(0, 7) : iso.slice(0, 4);
}

function periodLabel(key: string, grouping: Grouping) {
  if (grouping !== "month") return key;
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const share = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";

export async function buildReport(schoolYearId: number, input: ReportInput) {
  const { view, grouping, from, to } = input;
  const end = new Date(to.getTime() + 24 * 60 * 60 * 1000);

  // every active expense of the year in the range. a school records a few thousand a year at most,
  // so grouping in memory keeps one query for all four views
  const expenses = await prisma.expense.findMany({
    where: { schoolYearId, status: "ACTIVE", date: { gte: from, lt: end } },
    select: { date: true, amount: true, categoryId: true, paymentMethod: true },
    orderBy: { date: "asc" },
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const count = expenses.length;
  const summary = { total, count, average: count ? Math.round(total / count) : 0 };

  // sum and count per key, in first-seen order
  function group<K>(key: (e: (typeof expenses)[number]) => K) {
    const map = new Map<K, { amount: number; count: number }>();
    for (const e of expenses) {
      const k = key(e);
      const g = map.get(k) ?? { amount: 0, count: 0 };
      g.amount += e.amount;
      g.count += 1;
      map.set(k, g);
    }
    return map;
  }

  let table: ReportTable;

  if (view === "period") {
    const rows = [...group((e) => periodKey(e.date, grouping))].map(([key, g]) => ({
      cells: [periodLabel(key, grouping), g.count, g.amount],
    }));
    table = {
      columns: [
        { label: grouping === "day" ? "Day" : grouping === "month" ? "Month" : "Year" },
        { label: "Expenses", numeric: true },
        { label: "Amount (FCFA)", numeric: true },
      ],
      rows,
      totals: rows.length ? ["Total", count, total] : null,
    };
  } else if (view === "category" || view === "method") {
    const byCategory = view === "category";
    const names = byCategory
      ? new Map((await prisma.category.findMany({ select: { id: true, name: true } })).map((c) => [c.id, c.name]))
      : null;
    const rows = [...group((e) => (byCategory ? e.categoryId : e.paymentMethod))]
      .sort((a, z) => z[1].amount - a[1].amount)
      .map(([key, g]) => ({
        cells: [
          byCategory
            ? (names!.get(key as number) ?? "Unknown category")
            : (PAYMENT_METHODS.find((m) => m.value === key)?.label ?? String(key)),
          g.count,
          g.amount,
          share(g.amount, total),
        ],
      }));
    table = {
      columns: [
        { label: byCategory ? "Category" : "Payment method" },
        { label: "Expenses", numeric: true },
        { label: "Amount (FCFA)", numeric: true },
        { label: "Share", numeric: true },
      ],
      rows,
      totals: rows.length ? ["Total", count, total, "100%"] : null,
    };
  } else {
    // budget vs actual: a monthly budget counts once for every month the range touches
    const months = monthsCovered(from, to);
    const [budgets, categories] = await Promise.all([
      prisma.budget.findMany({ where: { schoolYearId } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ]);
    const nameById = new Map(categories.map((c) => [c.id, c.name]));
    const spent = group((e) => e.categoryId);

    const rows: ReportRow[] = budgets
      .map((b) => {
        const planned = b.period === "MONTHLY" ? b.amount * months : b.amount;
        const used = spent.get(b.categoryId)?.amount ?? 0;
        const usage = budgetUsage(used, planned);
        return {
          name: nameById.get(b.categoryId) ?? "Unknown category",
          row: {
            cells: [
              nameById.get(b.categoryId) ?? "Unknown category",
              b.period === "MONTHLY" ? `Monthly × ${months}` : "Yearly",
              planned,
              used,
              planned - used,
              `${usage.percent}%`,
              usage.label,
            ],
            tone: usage.tone,
          },
        };
      })
      .sort((a, z) => a.name.localeCompare(z.name))
      .map((x) => x.row);

    // spending with no budget still belongs in the statement
    const budgeted = new Set(budgets.map((b) => b.categoryId));
    for (const [id, g] of spent) {
      if (budgeted.has(id)) continue;
      rows.push({
        cells: [nameById.get(id) ?? "Unknown category", "No budget", 0, g.amount, -g.amount, "-", "No budget"],
        tone: "over",
      });
    }

    const plannedTotal = rows.reduce((s, r) => s + (r.cells[2] as number), 0);
    table = {
      columns: [
        { label: "Category" },
        { label: "Budget period" },
        { label: "Budget (FCFA)", numeric: true },
        { label: "Spent (FCFA)", numeric: true },
        { label: "Remaining (FCFA)", numeric: true },
        { label: "Used", numeric: true },
        { label: "Status" },
      ],
      rows,
      totals: rows.length
        ? ["Total", "", plannedTotal, total, plannedTotal - total, share(total, plannedTotal), ""]
        : null,
    };
  }

  return { summary, table };
}

// Excel opens a UTF-8 file with accents (Réaménagement) correctly only with the byte order mark
export function toCsv(table: ReportTable) {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [table.columns.map((c) => c.label), ...table.rows.map((r) => r.cells)];
  if (table.totals) lines.push(table.totals);
  return "﻿" + lines.map((l) => l.map(cell).join(",")).join("\r\n") + "\r\n";
}
