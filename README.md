# School Expense Manager

Expense management web app for a school: budgets per category, daily expense entry, and financial reports. Amounts are in FCFA and the UI is in English. Built for one person, signed in with a single password.

> Status: V1 live on Vercel + Neon, in demo testing. Built from the client spec (`Depenses_description.pdf`).

## Features

### Configuration, categories and budget
- School years: define the active year (e.g. 2026-2027) to separate expenses by year
- Expense categories: fully user-defined; create and archive any category
- Budget allocation: a yearly or monthly budget per category for the active school year
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

### Overview and reports
- Overview: budget used, spending over the school year, categories close to their limit, where the money went
- Statements for any date range: daily, monthly or yearly totals, by category, by payment method, budget vs actual
- CSV export of every statement (opens in Excel with accents intact)
- Print view; use "Save as PDF" in the print dialog for a PDF

### Look
- Light and dark mode (follows the device setting), works on phones

## Example categories (2026-2027)

These come from the client spec and are only a sample. Categories and budgets are fully user-defined. A monthly budget counts for all 12 months of the school year in yearly totals.

| Category | Monthly (FCFA) | Months | Annual total (FCFA) |
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

The spec's table was planned month by month. In the app, an item planned for a fixed number of months is entered as a yearly budget with its annual total.

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- PostgreSQL with Prisma 7 (driver adapter `@prisma/adapter-pg`)
- Server components for reads, server actions for writes, one route handler for CSV export
- Sign-in: one admin password, session in a signed HTTP-only cookie (HMAC, Web Crypto), checked in the proxy and again in every server action
- Hosting: Vercel (app) and Neon (Postgres), both in Frankfurt; weekly encrypted backups with GitHub Actions

## Design decisions

- Money is stored as integer FCFA (no decimals)
- Budget consumption is computed from expenses, never stored
- Expenses are cancelled, not deleted, to keep financial history
- Categories, accounts and suppliers are archived, not deleted, so old expenses keep their references
- Only one school year is active at a time; switching it is a single transaction
- Dates are stored at UTC midnight and grouped in UTC, so an expense never moves to the next or previous month
- A school year is assumed to run September 1 to August 31, read from its name ("2026-2027")

## Getting started (local)

Requirements: Node.js 20+, Docker Desktop.

```bash
git clone https://github.com/dgoumtsop/School-Expense-Tracker.git
cd School-Expense-Tracker
npm install
```

Create a `.env` file in the project root (it is git-ignored):

```text
DATABASE_URL="postgresql://expense:expense@localhost:5432/expense_tracker?schema=public"
ADMIN_PASSWORD="choose-a-password"
AUTH_SECRET="a-long-random-string"
```

Generate `AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the database, create the tables and run the app:

```bash
docker compose up -d
npx prisma migrate deploy
npx tsx prisma/seed.ts   # optional: sample school year, categories and budgets
npm run dev
```

`npm install` also generates the Prisma client. Open http://localhost:3000 and sign in with `ADMIN_PASSWORD`. If the app can't reach the database, make sure Docker Desktop is running and `docker compose up -d` has been run.

## Deploying (Vercel + Neon)

One-time setup:

1. **Vercel** (vercel.com): import the GitHub repository.
2. **Database**: in the Vercel project, open **Storage > Create Database > Neon**, pick the **Frankfurt (eu-central-1)** region and connect it to the project. This adds the connection variables for you:
   - `DATABASE_URL`: the **pooled** connection (host contains `-pooler`), used by the app
   - `DATABASE_URL_UNPOOLED`: the **direct** connection, used for migrations and backups

   (Using a Neon account directly instead works too: set `DATABASE_URL` to the pooled string and `DIRECT_URL` to the direct one.)
3. Add the two app settings (Project > Settings > Environment Variables):

   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | a long password, different from the local one |
   | `AUTH_SECRET` | a new random string (command above), never the local one |

4. Deploy. Vercel runs `npm run vercel-build`, which applies any pending migrations (`prisma migrate deploy`) and then builds the app. `vercel.json` pins the app to Frankfurt (`fra1`), next to the database.

After that, every push to `main` deploys automatically. Schema changes ship the same way: create a migration locally with `npx prisma migrate dev --name what-changed`, commit it, push.

Changing the password: edit `ADMIN_PASSWORD` in Vercel, then redeploy. Signing everyone out: change `AUTH_SECRET`, then redeploy.

## Backups

`.github/workflows/backup.yml` dumps the Neon database every Monday at 03:00 UTC, encrypts it, and keeps it for 90 days as a workflow artifact. It can also be run by hand (Actions > Database backup > Run workflow).

Setup: add two repository secrets (Settings > Secrets and variables > Actions):
- `DIRECT_URL`: the Neon direct connection string (the value of `DATABASE_URL_UNPOOLED` in Vercel)
- `BACKUP_PASSPHRASE`: a long passphrase. Store it in a password manager; without it a backup can't be opened.

Note: GitHub pauses scheduled workflows in a repository with no activity for 60 days. If that happens, re-enable it on the Actions tab.

Restore a backup (download the artifact from the workflow run, unzip it):

```bash
gpg --decrypt expenses-2026-10-26.dump.gpg > backup.dump
pg_restore --clean --if-exists --no-owner --dbname "DIRECT_URL here" backup.dump
```

Neon's own restore (to a recent point in time) is in the Neon console under Branches.

## User guide

1. **Start of the year**: on School years, add the year (e.g. 2027-2028) and make it active.
2. **Setup**: add your categories, accounts (cash box, bank, mobile money) and regular suppliers.
3. **Budgets**: on Budgets, pick a category, yearly or monthly, and the amount. Setting it again replaces the amount.
4. **Every day**: on Expenses, record each payment. A mistake can be edited; a payment that didn't happen is cancelled (it stays in the history, crossed out, and stops counting).
5. **Keeping an eye on it**: Overview shows how much of the budget is used and which categories are close to their limit.
6. **Reports**: on Reports, pick a statement and a date range. Export CSV opens in Excel; Print gives a clean page (or "Save as PDF").

## Project structure

```
prisma/              schema, migrations, seed script
src/lib/             prisma client, session, budget check, reports, formatting
src/app/             one folder per page (school-years, categories, budgets, accounts,
                     suppliers, expenses, reports, login); each has page.tsx and actions.ts
src/components/      sidebar, page header, budget bar and ring, spending chart
.github/workflows/   weekly database backup
```

## Roadmap

- [x] Setup: repo, Next.js, local Postgres, Prisma schema, seed data
- [x] Configuration screens: school years, categories, budgets, accounts, suppliers
- [x] Expenses: entry, edit, cancel, history filters, budget check
- [x] Design pass: app shell, tables, progress bars, mobile layout, dark mode
- [x] Reports: dashboard, statements, CSV export, print
- [x] Login
- [x] Deployment on Vercel + Neon, weekly encrypted backups
- [ ] Polish: expense list CSV, form messages, rename and un-archive, date checks, login rate limit

## Not in V1

Multiple users and roles, income tracking, payroll, accounting ledgers, mobile app, receipt uploads.
