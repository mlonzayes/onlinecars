-- Chat con IA del panel (add-on): mensajes por mes que el dealer puede usar.
--
-- Default 0 = apagado: ninguna cuenta existente queda con el chat habilitado
-- (y generando costo) sin que el super-admin lo active a mano.
ALTER TABLE "dealerships" ADD COLUMN "aiChatMonthlyMessages" INTEGER NOT NULL DEFAULT 0;
