-- Cambiar Quotation.vehicleId de ON DELETE RESTRICT a ON DELETE SET NULL.
-- Motivo: una cotización es histórica pero "blanda" (no concretó plata);
-- borrar el vehículo no debería bloquearse, igual que pasa con Lead.vehicleId.
ALTER TABLE "quotations"
  DROP CONSTRAINT "quotations_vehicleId_fkey";

ALTER TABLE "quotations"
  ADD CONSTRAINT "quotations_vehicleId_fkey"
  FOREIGN KEY ("vehicleId")
  REFERENCES "vehicles"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
