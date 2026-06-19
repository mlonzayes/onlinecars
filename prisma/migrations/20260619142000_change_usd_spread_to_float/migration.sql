-- AlterTable: usdSpread de Decimal(12,2) a Double Precision (Float).
-- El spread es un parámetro de configuración (no un monto contable), y Float
-- mantiene al Dealership serializable hacia Client Components. Los valores
-- existentes (0 por default) se castean sin pérdida.
ALTER TABLE "dealerships" ALTER COLUMN "usdSpread" SET DATA TYPE DOUBLE PRECISION;
