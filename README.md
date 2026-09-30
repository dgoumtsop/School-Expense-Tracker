# School Expense Manager

Expense management web app for a school: budgets per category, daily expense entry, and financial reports for the management board. Amounts are in FCFA and the UI is in English.

> Status: in development. Built from the client spec (`Depenses_description.pdf`).

## Features

### Configuration, categories and budget
- School years: define the active year (e.g. 2026-2027) to separate expenses by year
- Expense categories: fully user-defined; create, edit and archive any category
- Budget allocation: set a maximum budget per category (monthly, quarterly or yearly)
- Budget vs actual: visual indicator (color and percentage) of budget consumption
- Overspend alerts: warning as a budget nears its limit, confirmation before going over
- Accounts: main cash box, bank account, mobile money
- Payment methods: cash, bank transfer, cheque, mobile money
- Suppliers: register regular providers (bookshops, energy suppliers, craftsmen)

### Expense entry
- New expense: date, amount, category, payment method, account, supplier, description
- Add, edit and cancel expenses (cancelled expenses stay in history and are excluded from totals)
- Transaction history with filters

### Reports
- Dashboard: monthly spending and breakdown by category
- Periodic statements: daily, monthly, yearly
- Statements by payment method and by category
- Budget vs expenses statement
- CSV export, print view and PDF (via print)

## Example categories (2026-2027)

These come from the client spec and are only a sample of what the school tracks. Categories and budgets are fully user-defined, so this list is not fixed. It is loaded as optional starter data.

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
- PostgreSQL with Prisma
- Auth.js (single admin login)
- Zod for validation, Recharts for charts, Vitest for tests
- Hosting: Vercel + managed Postgres with automated backups

## Design decisions

- Money is stored as integer FCFA (no decimals)
- Budget consumption is computed from expenses, never stored
- Expenses are cancelled, not deleted, to keep financial history

## Getting started

Setup instructions will be added once the project is scaffolded.

## Roadmap

- [ ] Phase 0: repo, scaffold, schema, hello-world deploy
- [ ] Phase 1: login, layout, seed data
- [ ] Phase 2: configuration screens
- [ ] Phase 3: expense entry, budget engine, alerts
- [ ] Phase 4: dashboard and reports, CSV and print
- [ ] Phase 5: tests, empty/error states, user guide, release

## Not in V1

Multiple users and roles, income tracking, payroll, accounting ledgers, mobile app, receipt uploads.
