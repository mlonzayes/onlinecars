import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { logMeta, type ServiceContext } from "./context";

// Registro de quién cambió qué, desde qué canal. Lo llaman los servicios de
// escritura DESPUÉS de mutar, así cubre panel, MCP y chat sin tocar handlers.
//
// Fail-open: si falla la escritura del registro se loggea y la operación del
// dealer sigue. Perder una fila de auditoría es malo; frenarle la carga de un
// auto por eso es peor.
//
// `changes` NO lleva datos personales de clientes (nombres, documentos,
// teléfonos). Sí lleva costos: una pantalla que lo muestre tiene que respetar
// canSeeCosts.

export const AUDIT_ENTITY_TYPES = ["vehicle", "expense"] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

type AuditJson = string | number | boolean | null;
export type AuditSnapshot = Record<string, AuditJson>;
export type AuditDiff = Record<string, { from: AuditJson; to: AuditJson }>;

export interface AuditEntry {
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  changes?: AuditSnapshot | AuditDiff;
}

/** Decimal → string y Date → ISO, para que el JSON sea estable y comparable. */
function toAuditJson(value: unknown): AuditJson {
  if (value === undefined || value === null) return null;
  if (value instanceof Prisma.Decimal) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.stringify(value);
}

/** Foto de los campos elegidos (alta y baja). */
export function auditSnapshot<T extends object>(record: T, keys: readonly (keyof T & string)[]): AuditSnapshot {
  return Object.fromEntries(keys.map((key) => [key, toAuditJson(record[key])]));
}

/** Solo los campos que efectivamente cambiaron. */
export function auditDiff<T extends object>(before: T, after: T, keys: readonly (keyof T & string)[]): AuditDiff {
  const diff: AuditDiff = {};
  for (const key of keys) {
    const from = toAuditJson(before[key]);
    const to = toAuditJson(after[key]);
    if (from !== to) diff[key] = { from, to };
  }
  return diff;
}

export async function recordAudit(ctx: ServiceContext, entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        dealershipId: ctx.dealership.id,
        clerkUserId: ctx.dealership.currentUser.clerkUserId,
        source: ctx.source,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: entry.changes ?? Prisma.JsonNull,
        requestId: ctx.requestId,
      },
    });
  } catch (error) {
    logger.error(
      ctx.requestId,
      "audit.write_failed",
      logMeta(ctx, {
        action: entry.action,
        entityId: entry.entityId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
