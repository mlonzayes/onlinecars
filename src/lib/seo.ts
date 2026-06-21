/**
 * Constantes SEO del sitio de marketing (dominio principal).
 * SITE_URL debe ser el dominio canónico (sin trailing slash). Lo tomamos de
 * NEXT_PUBLIC_APP_URL para que coincida con el resto de la app; fallback al apex.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://motorflowapp.com"
).replace(/\/$/, "");

export const SITE_NAME = "MotorFlow";

export const SITE_DESCRIPTION =
  "MotorFlow es la plataforma para que tu concesionario de autos tenga su propio sitio web profesional: catálogo de vehículos, gestión de stock, captación de leads y operatoria de venta. Sin comisiones y sin depender de portales.";

// Contacto público (coincide con el footer / data del negocio).
export const SITE_EMAIL = "ventas@motorflowapp.com";

// Teléfono de contacto. SITE_PHONE en formato internacional (tel: y schema.org),
// SITE_PHONE_DISPLAY para mostrar, SITE_WHATSAPP solo dígitos para wa.me.
export const SITE_PHONE = "+5491134672565";
export const SITE_PHONE_DISPLAY = "+54 9 11 3467-2565";
export const SITE_WHATSAPP = "5491134672565";
