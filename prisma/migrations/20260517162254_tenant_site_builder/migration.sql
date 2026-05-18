-- AlterTable
ALTER TABLE "dealerships" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'base';

-- CreateTable
CREATE TABLE "dealership_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'seller',
    "token" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealership_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financing_plans" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assetType" TEXT NOT NULL,
    "assetUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_accounts" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "mlUserId" TEXT NOT NULL,
    "nickname" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_listings" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "mlAccountId" TEXT NOT NULL,
    "mlItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "listingTypeId" TEXT NOT NULL DEFAULT 'silver',
    "permalink" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealership_invites_token_key" ON "dealership_invites"("token");

-- CreateIndex
CREATE INDEX "dealership_invites_dealershipId_idx" ON "dealership_invites"("dealershipId");

-- CreateIndex
CREATE INDEX "reviews_dealershipId_status_idx" ON "reviews"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "financing_plans_dealershipId_active_idx" ON "financing_plans"("dealershipId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ml_accounts_dealershipId_key" ON "ml_accounts"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ml_listings_vehicleId_key" ON "ml_listings"("vehicleId");

-- CreateIndex
CREATE INDEX "ml_listings_dealershipId_idx" ON "ml_listings"("dealershipId");

-- AddForeignKey
ALTER TABLE "dealership_invites" ADD CONSTRAINT "dealership_invites_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financing_plans" ADD CONSTRAINT "financing_plans_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_accounts" ADD CONSTRAINT "ml_accounts_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_listings" ADD CONSTRAINT "ml_listings_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_listings" ADD CONSTRAINT "ml_listings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_listings" ADD CONSTRAINT "ml_listings_mlAccountId_fkey" FOREIGN KEY ("mlAccountId") REFERENCES "ml_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
