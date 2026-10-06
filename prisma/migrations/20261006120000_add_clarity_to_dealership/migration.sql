-- Microsoft Clarity por tenant: el dealer conecta SU proyecto de Clarity.
--
-- Nullable: ningún dealership queda con Clarity activo por accidente. El id es
-- público (se renderiza en el HTML del sitio), no es un secreto.
ALTER TABLE "dealerships" ADD COLUMN "clarityProjectId" TEXT;
