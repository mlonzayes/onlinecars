import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { SERVICE_ERROR_HTTP_STATUS, ServiceError } from "./service-error";
import type { ServiceContext } from "./context";

/**
 * Adaptador del canal dashboard: resuelve el contexto desde la sesión de Clerk.
 * Devuelve un `NextResponse` (401/404) si no se puede, para cortar con `return`.
 */
export async function getDashboardContext(
  requestId: string,
  event: string
): Promise<ServiceContext | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, `${event}.unauthorized`);
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, `${event}.no_dealership`, { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  return { requestId, dealership, source: "dashboard" };
}

/**
 * Corre la llamada al servicio y traduce un `ServiceError` a la respuesta JSON
 * de la API. Cualquier otro error sigue de largo hasta el 500 de `withLogger`.
 */
export async function withServiceErrors(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof ServiceError)) throw error;
    return NextResponse.json(
      { error: error.message, ...error.details },
      { status: SERVICE_ERROR_HTTP_STATUS[error.code] }
    );
  }
}
