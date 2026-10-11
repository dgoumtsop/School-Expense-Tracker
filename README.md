# School Expense Manager

Expense management web app for a school: budgets per category, daily expense entry, and financial reports for the management board. Amounts are in FCFA and the UI is in English.

> Status: in development. Built from the client spec (`Depenses_description.pdf`). Configuration and expense entry work; reports, design pass, login and deployment are next.

## Features

### Configuration, categories and budget
- School years: define the active year (e.g. 2026-2027) to separate expenses by year
- Expense categories: fully user-defined; create and archive any category
- Budget allocation: set a maximum budget per category for the active school year
- Budget vs actual: spent amount and percentage per category, with warning (80%) and over-budget (100%) levels
- Overspend alerts: heads-up after saving at 80%, confirmation required before going over 100%
- Accounts: main cash box, bank account, mobile money
- Payment methods: cash, bank transfer, cheque, mobile money
- Suppliers: register regular providers (bookshops, energy suppliers, craftsmen)

### Expense entry
- New expense: date, amount, category, payment method, account, supplier, description
- Edit and cancel expenses (cancelled expenses stay in history and are excluded from totals)
- Transaction history with filters: date range, category, payment method, status
- Spending in categories with no budget is shown on the budgets page

### Reports (planned)
- Dashboard: monthly spending and breakdown by category
- Periodic statements: daily, monthly, yearly
- Statements by payment method and by category
- Budget vs expenses statement
- CSV export, print view and PDF (via print)

## Example categories (2026-2027)

These come from the client spec and are only a sample of what the school tracks. Categories and budgets are fully user-defined, so this list is not fixed. The seed script loads a few of them as optional starter data.

| Category | Monthly (FCFA) | Count | Annual total (FCFA) |
|---|---:|---:|---:|
| Personnel salary 2026-2027 | 3,200,000 | 10 | 32,000,000 |
| Réaménagement primaire | 1,000,000 | 1 | 1,000,000 |
| Office materials | 600,000 | 1 | 600,000 |
| Holiday and Saturday classes | 500,000 | 1 | 500,000 |
| CEO / founder salary | 550,000 | 10 | 5,500,000 |
| MIGEC debt | 6,000,000 | 1 | 6,000,000 |
| ADVANS debt | 6,000,000 | 1 | 6,000,000 |
| ACEP debt | 4,200,000 | 1 | 4,200,000 |
| DELICES debt | 25,000,000 | 1 | 25,000,000 |
| Personal expenses | 1,000,000 | 1 | 1,000,000 |
| AS. DYNAMIQUE | 2,000,000 | 1 | 2,000,000 |

## Tech stack

- Next.js (App Router), TypeScript, Tailwind CSS
- PostgreSQL with Prisma 7 (driver adapter `@prisma/adapter-pg`)
- Server components and server actions for data access and forms
- Planned: Recharts for charts, Auth.js for a single admin login, Vitest for the budget logic tests
- Planned hosting: Vercel + managed Postgres with automated backups

## Design decisions

- Money is stored as integer FCFA (no decimals)
- Budget consumption is computed from expenses, never stored
- Expenses are cancelled, not deleted, to keep financial history
- Categories, accounts and suppliers are archived, not deleted, so old expenses keep their references
- Only one school year is active at a time; switching it is a single transaction

## Getting started

Requirements: Node.js 20+, Docker Desktop.

```bash
git clone https://github.com/dgoumtsop/School-Expense-Tracker.git
cd School-Expense-Tracker
npm install
```

Create a `.env` file in the project root (it is git-ignored):

```text
DATABASE_URL="postgresql://expense:expense@localhost:5432/expense_tracker?schema=public"
```

Start the database, create the tables, generate the Prisma client, and run the app:

```bash
docker compose up -d
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts   # optional: sample school year, categories and budgets
npm run dev
```

Open http://localhost:3000. If the app says it can't reach the database, make sure Docker Desktop is running and `docker compose up -d` has been run.

## Project structure

```
prisma/        schema, migrations, seed script
src/lib/       prisma client, budget check, payment methods, form state type
src/app/       one folder per page (school-years, categories, budgets,
               accounts, suppliers, expenses); each has page.tsx and actions.ts
```

## Roadmap

- [x] Setup: repo, Next.js, local Postgres, Prisma schema, seed data
- [x] Configuration screens: school years, categories, budgets, accounts, suppliers
- [x] Expenses: entry, edit, cancel, history filters, budget check
- [ ] Design pass: app shell, tables, progress bars, mobile layout
- [ ] Reports: dashboard, statements, CSV export, print
- [ ] Login, deployment with backups, tests, user guide

## Not in V1

Multiple users and roles, income tracking, payroll, accounting ledgers, mobile app, receipt uploads.