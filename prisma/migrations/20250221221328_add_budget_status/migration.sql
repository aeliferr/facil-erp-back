-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('pending', 'cancelled', 'done');

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "status" "BudgetStatus" NOT NULL DEFAULT 'pending';
