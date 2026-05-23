-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "quoteData" JSONB;

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "emittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdByClerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT,
    "saleClientName" TEXT,
    "saleClientDocument" TEXT,
    "saleClientEmail" TEXT,
    "saleClientPhone" TEXT,
    "saleTotalPrice" DECIMAL(12,2),
    "saleDownPayment" DECIMAL(12,2),
    "saleInstallments" INTEGER,
    "saleInstallmentAmount" DECIMAL(12,2),
    "salePaymentMethod" TEXT,
    "saleSellerName" TEXT,
    "leadId" TEXT,
    "purchaseSellerName" TEXT,
    "purchaseSellerDocument" TEXT,
    "purchaseSellerEmail" TEXT,
    "purchaseSellerPhone" TEXT,
    "purchaseBrand" TEXT,
    "purchaseModel" TEXT,
    "purchaseYear" INTEGER,
    "purchaseVersion" TEXT,
    "purchaseKilometers" INTEGER,
    "purchaseColor" TEXT,
    "purchaseFuelType" TEXT,
    "purchaseTransmission" TEXT,
    "purchaseCondition" TEXT,
    "purchaseOfferAmount" DECIMAL(12,2),
    "purchasePaymentMethod" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_counters" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotations_dealershipId_type_status_idx" ON "quotations"("dealershipId", "type", "status");

-- CreateIndex
CREATE INDEX "quotations_dealershipId_createdAt_idx" ON "quotations"("dealershipId", "createdAt");

-- CreateIndex
CREATE INDEX "quotations_leadId_idx" ON "quotations"("leadId");

-- CreateIndex
CREATE INDEX "quotations_vehicleId_idx" ON "quotations"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_dealershipId_type_number_key" ON "quotations"("dealershipId", "type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_dealershipId_code_key" ON "quotations"("dealershipId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_counters_dealershipId_type_key" ON "quotation_counters"("dealershipId", "type");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_counters" ADD CONSTRAINT "quotation_counters_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
