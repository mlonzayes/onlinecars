-- AlterTable: agregar precio de costo y moneda al vehículo
ALTER TABLE "vehicles"
  ADD COLUMN "costPrice" DECIMAL(12, 2),
  ADD COLUMN "costCurrency" TEXT;

-- AlterTable: flag para habilitar visibilidad de costos a roles no-admin
ALTER TABLE "dealerships"
  ADD COLUMN "showCostsToNonAdmins" BOOLEAN NOT NULL DEFAULT false;
