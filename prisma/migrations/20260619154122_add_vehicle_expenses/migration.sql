-- CreateTable
CREATE TABLE "vehicle_expenses" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_expenses_vehicleId_idx" ON "vehicle_expenses"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_expenses_dealershipId_idx" ON "vehicle_expenses"("dealershipId");

-- AddForeignKey
ALTER TABLE "vehicle_expenses" ADD CONSTRAINT "vehicle_expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_expenses" ADD CONSTRAINT "vehicle_expenses_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
