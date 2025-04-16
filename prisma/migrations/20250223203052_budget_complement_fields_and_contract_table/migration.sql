/*
  Warnings:

  - Added the required column `paymentMethod` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('pending', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('debit', 'credit', 'pix', 'boleto', 'cash');

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "contractid" UUID,
ADD COLUMN     "daysAfterDefinitionAndMeasurement" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "downPaymentPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "installment" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "status" "BudgetStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "workDays" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "definitionDate" DATE,
    "measurementDate" DATE,
    "signature" VARCHAR(250) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_contractid_fkey" FOREIGN KEY ("contractid") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
