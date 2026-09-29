# School-Expense-Tracker
# School Expense Manager

Expense management system for a school: budgets per category, daily expense entry, and financial reports for the management board. Currency is FCFA. The UI is in French.

> Status: in development. Built from the client spec (`Depenses_description.pdf`).

## Modules

### I. Configuration, categories and budget
- School years: define the active year (e.g. 2026-2027) to separate expenses by year
- Expense categories: create, edit and delete categories
- Budget allocation: set a maximum budget per category (monthly, quarterly or yearly)
- Budget vs actual: visual indicator (color and percentage) of budget consumption
- Overspend alerts: warn or block when an expense exceeds the allocated budget
- Accounts / cash boxes: main cash box, bank account, mobile money
- Payment methods: cash, bank transfer, cheque, mobile money
- Suppliers: register regular providers (bookshops, energy suppliers, craftsmen)

### II. Operations and expense entry
- New expense: date, amount, category, payment method, account, description
- Add, edit and delete expense lines
- Transaction history: editable list of all expenses

### III. Analysis and reporting
- Dashboard: monthly expense chart and breakdown by category
- Periodic statements: daily, monthly, yearly, printable
- Statements by payment method
- Statements by expense category
- Budget vs expenses statement
- Export to PDF and Excel/CSV, plus printing

## Initial categories

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

TBD

## Getting started

TBD

## Roadmap

- [ ] Data model (school year, category, budget, account, payment method, supplier, expense)
- [ ] Configuration screens
- [ ] Expense entry and history
- [ ] Budget vs actual indicators and overspend alerts
- [ ] Dashboard
- [ ] Reports, print, PDF and CSV export
