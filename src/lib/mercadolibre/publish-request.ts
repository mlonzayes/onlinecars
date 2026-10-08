/**
 * Llamadas del browser a los endpoints de ML del panel. Client-safe: solo fetch.
 * Publicar siempre va con "silver": así ML descuenta un lugar del paquete de
 * publicación. El destaque se aplica después (ver packs.ts).
 */

export interface MLRequestResult {
  ok: boolean;
  message: string;
  paymentRequired?: boolean;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  if (!data || typeof data !== "object") return fallback;
  const { error, details } = data as { error?: unknown; details?: unknown };
  const base = typeof error === "string" ? error : fallback;
  // validateForMLPublish devuelve los datos faltantes en `details` como { field, message }.
  const messages = Array.isArray(details)
    ? details
        .map((d: unknown) =>
          d && typeof d === "object" && "message" in d && typeof d.message === "string" ? d.message : null
        )
        .filter((m): m is string => m !== null)
    : [];
  return messages.length > 0 ? `${base}. ${messages.join(" ")}` : base;
}

export async function requestMLPublish(vehicleId: string): Promise<MLRequestResult> {
  const res = await fetch(`/api/vehiculos/${vehicleId}/ml`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingTypeId: "silver" }),
  });
  if (!res.ok) return { ok: false, message: await readError(res, "Error al publicar") };

  const data = (await res.json().catch(() => ({}))) as { paymentRequired?: boolean };
  return {
    ok: true,
    paymentRequired: data.paymentRequired === true,
    message: data.paymentRequired
      ? "Publicado en Mercado Libre, pendiente de pago (no había lugar en tus paquetes)"
      : "Publicado en Mercado Libre",
  };
}

export async function requestMLListingType(
  vehicleId: string,
  listingTypeId: "silver" | "gold" | "gold_premium"
): Promise<MLRequestResult> {
  const res = await fetch(`/api/vehiculos/${vehicleId}/ml/destacar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingTypeId }),
  });
  if (!res.ok) return { ok: false, message: await readError(res, "Error al destacar") };
  return {
    ok: true,
    message: listingTypeId === "silver" ? "Destaque quitado" : "Publicación destacada",
  };
}
