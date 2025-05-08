-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'vendor');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('fisica', 'juridica');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('pending', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('debit', 'credit', 'pix', 'boleto', 'money');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "document" VARCHAR(14) NOT NULL,
    "personType" "PersonType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logo" TEXT NOT NULL,
    "stripeCustomerId" VARCHAR(255),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'admin',
    "tenantId" UUID NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "PersonType" NOT NULL,
    "phone" VARCHAR(11),
    "rg" VARCHAR(9),
    "cpf" VARCHAR(11),
    "cnpj" VARCHAR(14),
    "zipcode" CHAR(8),
    "street" VARCHAR(255),
    "number" VARCHAR(50),
    "complement" VARCHAR(255),
    "neighborhood" VARCHAR(255),
    "city" VARCHAR(255),
    "state" VARCHAR(255),
    "tenantId" UUID NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'pending',
    "clientId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "installment" INTEGER NOT NULL DEFAULT 1,
    "downPaymentPercentage" INTEGER NOT NULL DEFAULT 0,
    "daysAfterDefinitionAndMeasurement" INTEGER NOT NULL DEFAULT 60,
    "workDays" BOOLEAN NOT NULL DEFAULT false,
    "contractid" UUID,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "definitionDate" DATE,
    "measurementDate" DATE,
    "signature" VARCHAR(250) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgetItems" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "unitValue" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "budgetId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "budgetItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_document_key" ON "tenants"("document");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_tenantId_key" ON "contracts"("tenantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_contractid_fkey" FOREIGN KEY ("contractid") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgetItems" ADD CONSTRAINT "budgetItems_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgetItems" ADD CONSTRAINT "budgetItems_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
