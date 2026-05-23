-- AlterTable: agregar campos de permuta (trade-in) a cotizaciones de venta
ALTER TABLE "quotations" ADD COLUMN "saleTradeInBrand" TEXT;
ALTER TABLE "quotations" ADD COLUMN "saleTradeInModel" TEXT;
ALTER TABLE "quotations" ADD COLUMN "saleTradeInYear" INTEGER;
ALTER TABLE "quotations" ADD COLUMN "saleTradeInValue" DECIMAL(12,2);
ALTER TABLE "quotations" ADD COLUMN "saleTradeInCurrency" TEXT;
