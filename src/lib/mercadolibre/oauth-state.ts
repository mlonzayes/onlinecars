/**
 * Firma y verificación del parámetro `state` del OAuth2 de Mercado Libre.
 *
 * El `state` cumple dos roles:
 *  1) Identifica a qué tenant pertenece el code (decodificamos dealershipId)
 *  2) Es el anti-CSRF token estándar de OAuth2 — tiene que ser unguessable y
 *     resistente a manipulación
 *
 * Antes el state era solo `base64url(dealershipId)`. Eso era vulnerable: un
 * atacante con su propio user válido podía construir un state apuntando a un
 * dealership ajeno, completar OAuth con SU cuenta de ML y dejar sus tokens
 * asociados al dealer víctima → "ML account hijack".
 *
 * Ahora el state es:
 *   payload = base64url(`${dealershipId}|${issuedAt}`)
 *   signature = base64url(HMAC-SHA256(secret, payload))
 *   state = `${payload}.${signature}`
 *
 * El secret se deriva de ML_TOKEN_SECRET con un contexto distinto (no
 * reutilizamos la misma clave para AES-GCM y HMAC).
 *
 * El callback verifica:
 *  - El formato y la firma
 *  - Que el state no esté expirado (TTL: 10 minutos)
 *  - Que el user autenticado tenga membership en el dealership (defense in depth)
 */
import { createHmac, timingSafeEqual } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutos — suficiente para completar OAuth

/**
 * Deriva la clave HMAC desde ML_TOKEN_SECRET con un contexto distinto al de
 * la encriptación de tokens. Si ML_TOKEN_SECRET se rota, el state queda
 * inválido automáticamente — comportamiento deseado.
 */
function getHmacKey(): Buffer {
  const secret = process.env.ML_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ML_TOKEN_SECRET no está definida en las variables de entorno.");
  }
  // Contexto separado para que la key del HMAC no sea idéntica a la del AES.
  return createHmac("sha256", secret).update("ml:oauth:state").digest();
}

function b64uEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64uDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

/**
 * Firma un state con dealershipId + timestamp + HMAC.
 */
export function signState(dealershipId: string): string {
  const issuedAt = Date.now();
  const payloadStr = `${dealershipId}|${issuedAt}`;
  const payload = b64uEncode(Buffer.from(payloadStr, "utf8"));

  const signature = b64uEncode(
    createHmac("sha256", getHmacKey()).update(payload).digest()
  );

  return `${payload}.${signature}`;
}

export type VerifyStateResult =
  | { ok: true; dealershipId: string }
  | { ok: false; reason: "format" | "signature" | "expired" };

/**
 * Verifica un state: formato, firma con timing-safe compare, y TTL.
 */
export function verifyState(state: string): VerifyStateResult {
  const parts = state.split(".");
  if (parts.length !== 2) return { ok: false, reason: "format" };

  const [payload, signature] = parts;
  if (!payload || !signature) return { ok: false, reason: "format" };

  let expected: Buffer;
  let received: Buffer;
  try {
    expected = createHmac("sha256", getHmacKey()).update(payload).digest();
    received = b64uDecode(signature);
  } catch {
    return { ok: false, reason: "format" };
  }

  // Longitudes distintas → timingSafeEqual tira. Tratamos como firma inválida.
  if (received.length !== expected.length) return { ok: false, reason: "signature" };
  if (!timingSafeEqual(expected, received)) return { ok: false, reason: "signature" };

  let payloadStr: string;
  try {
    payloadStr = b64uDecode(payload).toString("utf8");
  } catch {
    return { ok: false, reason: "format" };
  }

  const sep = payloadStr.indexOf("|");
  if (sep < 0) return { ok: false, reason: "format" };

  const dealershipId = payloadStr.slice(0, sep);
  const issuedAt = Number(payloadStr.slice(sep + 1));
  if (!dealershipId || !Number.isFinite(issuedAt)) {
    return { ok: false, reason: "format" };
  }

  if (Date.now() - issuedAt > STATE_TTL_MS) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, dealershipId };
}
