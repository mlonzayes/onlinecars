/**
 * Tipos del tracking de Meta (Pixel del browser + Conversions API del server).
 *
 * Regla de oro de este módulo: los datos personales (email, teléfono, nombre)
 * NUNCA viajan en claro a Meta ni a nuestros logs. Se hashean con SHA-256 en
 * `hash.ts` antes de salir. Ver `.claude/rules/tracking.md`.
 */

/**
 * Identidad del visitante para el matching de Meta.
 *
 * Los campos de la primera sección se hashean (Meta lo exige). Los de la
 * segunda NO: son señales técnicas que el browser ya le entrega a Meta igual,
 * y hashearlas rompería el match.
 */
export interface MetaUserData {
  // --- Se hashean (SHA-256) ---
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  /** ISO 3166-1 alpha-2 (ej: "AR"). */
  country?: string | null;
  /** Id propio y estable del usuario (ej: dealershipId). Se hashea igual. */
  externalId?: string | null;

  // --- NO se hashean ---
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  /** Cookie `_fbp` que setea el pixel. Sube muchísimo el match quality. */
  fbp?: string | null;
  /** Cookie `_fbc` (click id de un ad). Es LA señal que atribuye la venta. */
  fbc?: string | null;
}

/** Datos de negocio del evento. Nombres en camelCase; el mapeo a snake_case
 *  que espera la API de Meta lo hace `capi.ts`. */
export interface MetaCustomData {
  currency?: string;
  value?: number;
  contentName?: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: "product" | "product_group" | "vehicle";
  numItems?: number;
  /** Campos libres del negocio (ej: plan elegido, slug del tenant). */
  [key: string]: unknown;
}

/** Credenciales resueltas de un destino de tracking (web principal o tenant). */
export interface MetaPixelCredentials {
  pixelId: string;
  accessToken: string;
  /** Código de "Test Events" del Events Manager. Solo para debug, nunca en prod. */
  testEventCode?: string | null;
}
