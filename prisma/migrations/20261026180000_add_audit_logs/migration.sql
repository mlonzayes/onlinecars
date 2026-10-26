-- Registro de cambios por usuario y canal (panel, MCP, chat). Sin FK a la
-- entidad: el registro de un borrado sobrevive a la fila borrada.

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_dealershipId_createdAt_idx" ON "audit_logs"("dealershipId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_dealershipId_entityType_entityId_idx" ON "audit_logs"("dealershipId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
