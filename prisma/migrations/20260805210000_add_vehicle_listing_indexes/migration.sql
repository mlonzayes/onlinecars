-- Indexes for the dashboard vehicle listing.
--
-- The listing orders by createdAt DESC by default and filters by publishedAt
-- ("Solo publicados" / "Solo borradores"). Without these, Postgres scans every
-- vehicle of the dealership and sorts in memory on each page load.
--
-- The existing [dealershipId, status] index already covers the status filter.

CREATE INDEX "vehicles_dealershipId_createdAt_idx"
  ON "vehicles" ("dealershipId", "createdAt");

CREATE INDEX "vehicles_dealershipId_publishedAt_idx"
  ON "vehicles" ("dealershipId", "publishedAt");
