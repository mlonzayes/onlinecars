-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "unlimitedStock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "unlimitedStock" BOOLEAN NOT NULL DEFAULT false;

-- Recrear el índice único parcial de ventas activas excluyendo las de stock
-- ilimitado (0km). Así un vehículo con unlimitedStock=true puede tener varias
-- ventas activas a la vez; los vehículos normales siguen con "una venta activa".
DROP INDEX "sales_active_vehicleId_key";
CREATE UNIQUE INDEX "sales_active_vehicleId_key"
  ON "sales" ("vehicleId")
  WHERE status <> 'cancelled' AND "unlimitedStock" = false;
