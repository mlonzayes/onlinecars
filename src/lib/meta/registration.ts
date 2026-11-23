/**
 * Conversión `CompleteRegistration` de la WEB PRINCIPAL: un dealer terminó el
 * onboarding y arrancó la prueba gratis. Es LA conversión de las campañas de
 * Meta, porque el CTA principal de la landing es "Probar 15 días gratis".
 *
 * ⚠️ SERVER-ONLY. Solo CAPI, sin pixel del browser: el pixel vive en el layout
 * de `(marketing)` y el onboarding no lo monta. Como sale por un único canal,
 * no hay nada que deduplicar y el `eventId` se genera acá.
 *
 * La atribución al anuncio sale de las cookies `_fbp`/`_fbc` que dejó el pixel
 * en la landing: viven en el dominio raíz, así que llegan en este request.
 */
import { after } from "next/server";
import { getClientIp } from "@/lib/rate-limit";
import { extractMetaBrowserSignals, getMainSiteCapiCredentials, sendMetaConversionEvent } from "./capi";

export interface RegistrationConversionInput {
  request: Request;
  requestId: string;
  dealershipId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
}

/**
 * Programa el envío con `after()` (no `void`): en Vercel una promesa suelta
 * después del `return` se puede cortar. Fail-open: si falta la config o Meta
 * falla, se loggea y el alta sigue igual.
 */
export function trackRegistrationConversion(input: RegistrationConversionInput): void {
  const credentials = getMainSiteCapiCredentials();
  if (!credentials) return;

  const { request, requestId, dealershipId } = input;
  const eventSourceUrl = request.headers.get("referer");
  const signals = extractMetaBrowserSignals(request, eventSourceUrl);
  const ip = getClientIp(request);

  after(async () => {
    await sendMetaConversionEvent({
      credentials,
      eventName: "CompleteRegistration",
      eventId: globalThis.crypto.randomUUID(),
      eventSourceUrl,
      userData: {
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        city: input.city,
        state: input.province,
        country: input.country,
        externalId: dealershipId,
        clientIpAddress: ip === "unknown" ? null : ip,
        ...signals,
      },
      customData: {
        contentName: "alta-prueba-gratis",
        contentCategory: "saas-motorflow",
      },
      requestId,
      logContext: { surface: "marketing", step: "onboarding" },
    });
  });
}
