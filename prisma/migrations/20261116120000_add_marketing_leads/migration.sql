-- Consultas del form de contacto de la web principal, con la atribución de la
-- campaña (UTMs + click ids). Antes solo se avisaban por Telegram y no quedaban en la DB.

-- CreateTable
CREATE TABLE "marketing_leads" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "plan" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dealership" TEXT,
    "message" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "fbclid" TEXT,
    "gclid" TEXT,
    "landingPage" TEXT,
    "referrer" TEXT,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_leads_createdAt_idx" ON "marketing_leads"("createdAt");

-- CreateIndex
CREATE INDEX "marketing_leads_utmCampaign_createdAt_idx" ON "marketing_leads"("utmCampaign", "createdAt");

