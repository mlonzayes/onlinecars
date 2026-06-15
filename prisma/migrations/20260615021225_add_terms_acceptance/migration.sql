-- CreateTable
CREATE TABLE "terms_acceptances" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "dealershipId" TEXT,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terms_acceptances_clerkUserId_version_idx" ON "terms_acceptances"("clerkUserId", "version");

-- CreateIndex
CREATE INDEX "terms_acceptances_clerkUserId_acceptedAt_idx" ON "terms_acceptances"("clerkUserId", "acceptedAt");
