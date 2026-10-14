-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('YEARLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "period" "BudgetPeriod" NOT NULL DEFAULT 'YEARLY';
