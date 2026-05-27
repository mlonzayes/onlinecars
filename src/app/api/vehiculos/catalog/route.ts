/**
 * GET /api/vehiculos/catalog?q=xxx
 *
 * Endpoint de búsqueda del catálogo de modelos para autocompletar el form
 * de carga de vehículos. Server-only: lee el CSV vía src/lib/vehicle-catalog.ts
 * (cacheado a nivel módulo, solo lee disco una vez por proceso).
 *
 * Solo accesible para users autenticados con dealership — no es público.
 * No tiene sentido rate-limitar porque es interno y de bajo costo (búsqueda
 * en memoria sobre un array de ~400 items).
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getCurrentDealership } from "@/lib/auth";
import { searchVehicleCatalog } from "@/lib/vehicle-catalog";

const MAX_RESULTS = 15;

export const GET = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Requerimos dealership: el catálogo no se debería poder scrapear desde
  // una cuenta vacía o de prueba sin onboarding.
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    // Devolvemos array vacío (no error) para que el cliente no muestre nada
    // mientras el user todavía está tipeando — UX más limpia que un 400.
    return NextResponse.json({ data: [] });
  }

  const results = searchVehicleCatalog(q, MAX_RESULTS);

  logger.info(requestId, "vehicles.catalog.search", {
    dealershipId: dealership.id,
    query: q,
    resultCount: results.length,
  });

  return NextResponse.json({ data: results });
});
