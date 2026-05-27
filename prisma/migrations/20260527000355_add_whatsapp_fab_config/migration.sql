-- Botón flotante de WhatsApp customizable por el dealer.
-- whatsappFabEnabled: controla la VISIBILIDAD del FAB en el sitio público.
-- whatsappMessage: texto pre-cargado al abrir el chat (null = copy default).
--
-- Default false en enabled: aunque el plan lo permita, el dealer tiene que
-- activarlo conscientemente desde el admin. Ningún sitio aparece con el FAB
-- "espontáneamente" al deploy de esta migración.
ALTER TABLE "dealerships"
  ADD COLUMN "whatsappMessage" TEXT,
  ADD COLUMN "whatsappFabEnabled" BOOLEAN NOT NULL DEFAULT false;
