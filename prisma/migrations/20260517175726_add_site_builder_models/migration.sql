-- CreateTable
CREATE TABLE "dealership_sections" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealership_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealership_media" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealership_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dealership_sections_dealershipId_order_idx" ON "dealership_sections"("dealershipId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "dealership_sections_dealershipId_type_key" ON "dealership_sections"("dealershipId", "type");

-- CreateIndex
CREATE INDEX "dealership_media_dealershipId_sectionType_idx" ON "dealership_media"("dealershipId", "sectionType");

-- CreateIndex
CREATE INDEX "dealership_media_dealershipId_purpose_idx" ON "dealership_media"("dealershipId", "purpose");

-- AddForeignKey
ALTER TABLE "dealership_sections" ADD CONSTRAINT "dealership_sections_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealership_media" ADD CONSTRAINT "dealership_media_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
