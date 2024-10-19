/*
  Warnings:

  - You are about to drop the column `clientName` on the `budgets` table. All the data in the column will be lost.
  - Added the required column `clientid` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('fisica', 'juridica');

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "clientName",
ADD COLUMN     "clientid" UUID NOT NULL;

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "ClientType" NOT NULL,
    "phone" VARCHAR(11),
    "rg" VARCHAR(9),
    "cpf" VARCHAR(11),
    "cnpj" VARCHAR(14),
    "zipcode" CHAR(8) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "complement" VARCHAR(255),
    "neighborhood" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_clientid_fkey" FOREIGN KEY ("clientid") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
