-- Drop the default value
ALTER TABLE "vehicles" ALTER COLUMN "publicSlug" DROP DEFAULT;

-- Create the unique constraint
CREATE UNIQUE INDEX "vehicles_dealershipId_publicSlug_key" ON "vehicles"("dealershipId", "publicSlug");
