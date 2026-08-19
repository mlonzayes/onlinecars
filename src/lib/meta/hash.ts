/**
 * Normalización + hashing SHA-256 de los datos personales que van a la
 * Conversions API.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO: Meta exige que email/teléfono/nombre lleguen
 * hasheados. Pero el hash es determinístico — si normalizás distinto que Meta,
 * el hash da distinto y el match NO ocurre. `Juan@Gmail.com ` y `juan@gmail.com`
 * son dos hashes diferentes. Por eso normalizamos ANTES de hashear, siguiendo
 * al pie de la letra la spec de Meta. Un match malo no falla ruidosamente: te
 * deja el Ads Manager mostrando 3 conversiones donde hubo 12.
 *
 * Usa Web Crypto (`crypto.subtle`), que corre igual en Node y en Edge runtime.
 */
import type { MetaUserData } from "./types";

/** SHA-256 en hexadecimal minúscula, que es el formato que espera Meta. */
export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Rango de combining marks (U+0300-U+036F). Se declara con escapes ASCII y no
// con los caracteres literales: literales sobreviven mal a un cambio de
// encoding del archivo, y el bug resultante es mudo (los nombres con acento
// simplemente dejan de matchear en Meta).
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Saca acentos y diacríticos: "Martín" → "martin". */
function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(COMBINING_MARKS, "");
}

/** Email: trim + minúsculas. Meta NO quiere que saquemos los puntos de Gmail. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Teléfono: solo dígitos, CON código de país y SIN el `+`.
 *
 * Argentina es el caso jodido y hay que tratarlo explícito. El dealer escribe
 * "11 7823-5546", "011 7823 5546" o "+54 9 11 7823-5546" y las tres tienen que
 * terminar en el mismo hash. Reglas aplicadas, en orden:
 *   1. Se quedan solo los dígitos.
 *   2. Se saca el 0 inicial de larga distancia nacional (011 → 11).
 *   3. Se saca el 15 de celular si quedó pegado al área.
 *   4. Si no arranca con código de país, se antepone el default.
 */
export function normalizePhone(value: string, defaultCountryCode = "54"): string {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // Ya viene internacional (54..., 1..., 34...): lo dejamos como está.
  if (digits.startsWith(defaultCountryCode) && digits.length > 10) return digits;

  digits = digits.replace(/^0+/, "");
  // El 15 solo se saca si sobra número después: "1157..." es un área válida.
  if (digits.startsWith("15") && digits.length > 10) digits = digits.slice(2);

  return `${defaultCountryCode}${digits}`;
}

/** Nombres: minúsculas, sin acentos, sin puntuación ni espacios sobrantes. */
export function normalizeName(value: string): string {
  return stripDiacritics(value.trim().toLowerCase()).replace(/[^a-z\s]/g, "").trim();
}

/** Ciudad / provincia: minúsculas, sin acentos, sin espacios ni puntuación. */
export function normalizeRegion(value: string): string {
  return stripDiacritics(value.trim().toLowerCase()).replace(/[^a-z]/g, "");
}

/** País: ISO alpha-2 en minúscula. */
export function normalizeCountry(value: string): string {
  return value.trim().toLowerCase().slice(0, 2);
}

/** Código postal: minúsculas sin espacios (el argentino puede llevar letras). */
export function normalizeZip(value: string): string {
  return value.trim().toLowerCase().replace(/\s/g, "");
}

/** Hashea si el valor sobrevive a la normalización; si queda vacío, no manda el campo. */
async function hashOrSkip(
  raw: string | null | undefined,
  normalize: (v: string) => string
): Promise<string | undefined> {
  if (!raw) return undefined;
  const normalized = normalize(raw);
  if (!normalized) return undefined;
  return sha256Hex(normalized);
}

/**
 * Arma el objeto `user_data` con las claves cortas que espera la API de Meta
 * (`em`, `ph`, `fn`, ...). Los campos vacíos se omiten: mandar un hash de
 * string vacío es peor que no mandar nada — Meta lo cuenta como intento de
 * match fallido y te baja el score de calidad.
 */
export async function buildHashedUserData(
  user: MetaUserData
): Promise<Record<string, string>> {
  const [em, ph, fn, ln, ct, st, zp, country, externalId] = await Promise.all([
    hashOrSkip(user.email, normalizeEmail),
    hashOrSkip(user.phone, (v) => normalizePhone(v)),
    hashOrSkip(user.firstName, normalizeName),
    hashOrSkip(user.lastName, normalizeName),
    hashOrSkip(user.city, normalizeRegion),
    hashOrSkip(user.state, normalizeRegion),
    hashOrSkip(user.zip, normalizeZip),
    hashOrSkip(user.country, normalizeCountry),
    hashOrSkip(user.externalId, (v) => v.trim()),
  ]);

  const data: Record<string, string> = {};
  if (em) data.em = em;
  if (ph) data.ph = ph;
  if (fn) data.fn = fn;
  if (ln) data.ln = ln;
  if (ct) data.ct = ct;
  if (st) data.st = st;
  if (zp) data.zp = zp;
  if (country) data.country = country;
  if (externalId) data.external_id = externalId;

  // Señales técnicas: van EN CLARO a propósito. Meta ya las recibe del browser;
  // hashearlas rompe el match en vez de proteger algo.
  if (user.clientIpAddress) data.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) data.client_user_agent = user.clientUserAgent;
  if (user.fbp) data.fbp = user.fbp;
  if (user.fbc) data.fbc = user.fbc;

  return data;
}
