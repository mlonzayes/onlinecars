-- Add bodyType column to vehicles for category filtering on tenant home.
-- Nullable: existing rows can be back-filled gradually from the dashboard.
ALTER TABLE "vehicles" ADD COLUMN "bodyType" TEXT;
