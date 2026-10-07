import { Prisma } from "@prisma/client";

export const SERVICE_ERROR_CODES = [
  "not_found",
  "forbidden",
  "account_blocked",
  "plan_limit",
  "conflict",
] as const;
export type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[number];

export const SERVICE_ERROR_HTTP_STATUS: Record<ServiceErrorCode, number> = {
  not_found: 404,
  forbidden: 403,
  account_blocked: 403,
  plan_limit: 403,
  conflict: 409,
};

/**
 * Error de negocio esperado (no un bug). Los servicios lo tiran y cada canal lo
 * traduce a su formato: el dashboard a un JSON con status HTTP, el MCP a un
 * resultado de tool con `isError`. `message` ya está en español y es mostrable.
 * `details` se suma al body (ej: `blockingSale`) y no debe llevar PII.
 */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ServiceErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.details = details;
  }
}

/** P2025: el registro no existe (o no es del tenant, por el filtro del where). */
export function isPrismaNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
