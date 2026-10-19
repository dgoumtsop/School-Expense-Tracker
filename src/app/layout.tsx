import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { prisma } from "@/lib/prisma";
import { isLoggedIn } from "@/lib/session";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "School Expense Manager",
  description: "Budgets, expenses and reports for the school",
};

// the sidebar shows which school year is active, if the db is down it just says none
async function getActiveYearName() {
  try {
    const year = await prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { name: true },
    });
    return year?.name ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = `${jakarta.variable} ${geistMono.variable}`;

  // signed out: just the page (the login form), no sidebar and no database call
  if (!(await isLoggedIn())) {
    return (
      <html lang="en" className={fonts}>
        <body className="min-h-screen">{children}</body>
      </html>
    );
  }

  const activeYear = await getActiveYearName();

  return (
    <html lang="en" className={fonts}>
      <body className="min-h-screen">
        <Sidebar activeYear={activeYear} />
        <main className="md:pl-64 print:pl-0">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-10">{children}</div>
        </main>
      </body>
    </html>
  );
}