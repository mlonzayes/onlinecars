-- AlterTable
ALTER TABLE "dealerships" ADD COLUMN     "usdSpread" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rate" DECIMAL(12,4) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'bcra',
    "date" DATE NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rates_currency_date_idx" ON "exchange_rates"("currency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currency_date_key" ON "exchange_rates"("currency", "date");
