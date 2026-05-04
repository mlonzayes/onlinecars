-- Replace the full unique constraint on Sale.vehicleId with a partial unique index.
-- Goal: a vehicle can only have ONE active sale at a time, but cancelled sales
-- (which are kept for history) do not block creating a new sale for the same vehicle.

-- Drop the original full unique index (created when @unique was declared in schema).
DROP INDEX "sales_vehicleId_key";

-- Partial unique: only enforce uniqueness for non-cancelled sales.
CREATE UNIQUE INDEX "sales_active_vehicleId_key"
  ON "sales" ("vehicleId")
  WHERE "status" != 'cancelled';
