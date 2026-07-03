-- AlterTable
ALTER TABLE "dealerships" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'AR',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ARS',
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'es-AR',
ADD COLUMN     "siteLocale" TEXT NOT NULL DEFAULT 'es-AR',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires';
