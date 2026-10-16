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
    <div className="bg-ink text-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col">
      <div className="flex items-center justify-between px-5 py-4 md:block md:py-6">
        <div>
          <p className="text-base font-semibold leading-tight">School Expense Manager</p>
          <Link
            href="/school-years"
            className={`mt-1 inline-block text-sm hover:text-white ${
              activeYear ? "text-indigo-200" : "text-amber-300"
            }`}
          >
            {activeYear ? `School year ${activeYear}` : "No active school year"}
          </Link>
        </div>
        <button
          type="button"
          className="rounded-md border border-white/25 px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id="main-nav"
        className={`${open ? "block" : "hidden"} px-3 pb-4 md:block md:flex-1 md:overflow-y-auto`}
      >
        {GROUPS.map((group, i) => (
          <div key={i} className="mb-4">
            {group.title && (
              <p className="mb-1 px-3 text-xs text-white/50">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive(link.href)
                        ? "bg-white/15 font-medium text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <form action={logout} className="border-t border-white/10 pt-3">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </nav>
    </div>
  );
}