"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/login/actions";

const GROUPS = [
  { title: null, links: [{ href: "/", label: "Overview" }] },
  {
    title: "Money",
    links: [
      { href: "/expenses", label: "Expenses" },
      { href: "/budgets", label: "Budgets" },
      { href: "/reports", label: "Reports" },
    ],
  },
  {
    title: "Setup",
    links: [
      { href: "/school-years", label: "School years" },
      { href: "/categories", label: "Categories" },
      { href: "/accounts", label: "Accounts" },
      { href: "/suppliers", label: "Suppliers" },
    ],
  },
];

export function Sidebar({ activeYear }: { activeYear: string | null }) {
  const pathname = usePathname();
  // only matters on phones, on a wide screen the menu is always there
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-20 print:hidden border-b border-line bg-surface/90 backdrop-blur md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-r md:border-b-0 md:bg-surface">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 md:block md:px-6 md:py-7">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-on-accent shadow-md shadow-accent/30"
          >
            S
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight">School Expenses</p>
            <Link
              href="/school-years"
              className={`mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium hover:underline ${
                activeYear ? "text-accent-strong" : "text-warn-ink"
              }`}
            >
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${activeYear ? "bg-good" : "bg-warn"}`}
              />
              {activeYear ? `School year ${activeYear}` : "No active school year"}
            </Link>
          </div>
        </div>
        <button
          type="button"
          className="rounded-xl border border-line px-3.5 py-1.5 text-sm font-medium md:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id="main-nav"
        className={`${open ? "block" : "hidden"} px-3 pb-4 md:block md:flex-1 md:overflow-y-auto md:px-4`}
      >
        {GROUPS.map((group, i) => (
          <div key={i} className="mb-5">
            {group.title && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive(link.href)
                        ? "bg-accent-soft font-semibold text-accent-strong"
                        : "font-medium text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <form action={logout} className="border-t border-line pt-3">
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-bad-soft hover:text-bad-ink"
          >
            Sign out
          </button>
        </form>
      </nav>
    </div>
  );
}
