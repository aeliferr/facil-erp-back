/*
  Warnings:

  - You are about to drop the column `clientid` on the `budgets` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_clientid_fkey";

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "clientid",
ADD COLUMN     "clientId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
