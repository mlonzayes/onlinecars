-- AlterTable
ALTER TABLE "dealerships" ADD COLUMN     "paidUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "method" TEXT,
    "notes" TEXT,
    "paidUntil" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByClerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_payments_dealershipId_paidAt_idx" ON "subscription_payments"("dealershipId", "paidAt");

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
