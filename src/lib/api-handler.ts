import { NextResponse } from "next/server";
import { generateRequestId, logger } from "./logger";

// Limita el tamaño del request_id que viene del header para evitar abuso.
const MAX_INCOMING_ID_LENGTH = 128;

export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  startedAt: number;
}

// Toma el x-request-id del header si vino válido, si no genera uno nuevo.
export function resolveRequestId(request: Request): string {
  const headerId = request.headers.get("x-request-id");
  if (
    headerId &&
    headerId.length > 0 &&
    headerId.length <= MAX_INCOMING_ID_LENGTH
  ) {
    return headerId;
  }
  return generateRequestId();
}

// Hook ejecutado antes del handler. Inicializa el contexto y loggea el inicio.
export function beforeRequest(
  request: Request,
  requestId: string
): RequestLogContext {
  const url = new URL(request.url);
  const ctx: RequestLogContext = {
    requestId,
    method: request.method,
    path: url.pathname,
    startedAt: Date.now(),
  };

  logger.info(requestId, "request.start", {
    method: ctx.method,
    path: ctx.path,
  });

  return ctx;
}

// Hook ejecutado tras un handler exitoso. Loggea el fin con duración y status.
export function afterRequest(
  ctx: RequestLogContext,
  response: Response
): void {
  const durationMs = Date.now() - ctx.startedAt;

  logger.info(ctx.requestId, "request.end", {
    method: ctx.method,
    path: ctx.path,
    status: response.status,
    durationMs,
  });
}

// Hook ejecutado cuando el handler lanza una excepción no manejada.
export function onRequestError(
  ctx: RequestLogContext,
  error: unknown
): void {
  const durationMs = Date.now() - ctx.startedAt;

  logger.error(ctx.requestId, "request.error", {
    method: ctx.method,
    path: ctx.path,
    durationMs,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

// Default vacío en lugar de `undefined` para matchear la firma de Next.js 15
// — el framework siempre pasa `{ params: Promise<{}> }` aunque la ruta no tenga
// segmentos dinámicos.
export interface ApiHandlerContext<TParams = Record<string, never>> {
  requestId: string;
  params: TParams;
}

type ApiHandler<TParams> = (
  request: Request,
  ctx: ApiHandlerContext<TParams>
) => Promise<Response> | Response;

interface RouteContext<TParams> {
  params: Promise<TParams>;
}

export function withLogger<TParams = Record<string, never>>(
  handler: ApiHandler<TParams>
) {
  return async (
    request: Request,
    routeCtx: RouteContext<TParams>
  ): Promise<Response> => {
    const requestId = resolveRequestId(request);
    const reqCtx = beforeRequest(request, requestId);

    let response: Response;
    try {
      const params = await routeCtx.params;
      response = await handler(request, { requestId, params });
    } catch (error) {
      onRequestError(reqCtx, error);
      const errResponse = NextResponse.json(
        { error: "Error interno del servidor", requestId },
        { status: 500 }
      );
      errResponse.headers.set("x-request-id", requestId);
      return errResponse;
    }

    afterRequest(reqCtx, response);
    response.headers.set("x-request-id", requestId);
    return response;
  };
}
