-- Sistema de trial: agregar estado de suscripción y fecha de fin de prueba.
-- Los dealerships existentes quedan con subscriptionStatus = "trial" pero
-- trialEndsAt = NULL → la lógica del guard interpreta NULL como "sin expiración"
-- (legacy). Para forzar trial real, hay que setearles manualmente trialEndsAt.
ALTER TABLE "dealerships"
  ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- Marcamos los dealerships YA existentes como "active" para no romper accesos.
-- Solo los nuevos (post-launch) van a entrar con status = 'trial'.
UPDATE "dealerships" SET "subscriptionStatus" = 'active';

-- Sistema de invitación: extender WaitlistEntry con los campos del funnel.
ALTER TABLE "waitlist_entries"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "inviteToken" TEXT,
  ADD COLUMN "invitedAt" TIMESTAMP(3),
  ADD COLUMN "inviteExpiresAt" TIMESTAMP(3),
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "clerkUserId" TEXT;

-- Constraint de unicidad sobre el token (también index implícito).
CREATE UNIQUE INDEX "waitlist_entries_inviteToken_key" ON "waitlist_entries"("inviteToken");

-- Index para listar leads por estado (lo que usa el admin panel).
CREATE INDEX "waitlist_entries_status_idx" ON "waitlist_entries"("status");
