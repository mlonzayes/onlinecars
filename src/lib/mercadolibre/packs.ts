/**
 * Paquetes de publicación de Mercado Libre para vehículos.
 *
 * Los concesionarios no pagan aviso por aviso: contratan con su ejecutivo de ML
 * un paquete de N publicaciones (listing_type "silver") y, opcionalmente, uno de
 * destaques ("gold" / "gold_premium"). La contratación NO se puede hacer por API;
 * acá solo leemos el cupo.
 *
 * Cómo se consume (doc "Gestiona paquetes de vehículos"):
 * - Publicar: POST /items con listing_type_id "silver" → ML descuenta un lugar
 *   de algún paquete de publicación activo. No se elige el paquete puntual.
 * - Destacar: POST /items/{id}/listing_type → descuenta un lugar del paquete de
 *   destaques. Volver a "silver" libera ese lugar.
 */
import { mlFetch } from "./client";
import { isMLUpgradeListingType, type MLUpgradeListingType } from "./listing-types";
import type { MLPromotionPack } from "./types";

export interface MLPackSummary {
  id: string;
  name: string;
  kind: "publications" | "upgrades";
  listingTypes: string[];
  total: number;
  used: number;
  remaining: number;
  expiresAt: string | null;
  autoRenew: boolean;
}

export interface MLPacksOverview {
  packs: MLPackSummary[];
  publicationsRemaining: number;
  // Cupo de destaques disponible por listing_type (ej: { gold: 2 }).
  upgradesRemaining: Partial<Record<MLUpgradeListingType, number>>;
}

function toSummary(pack: MLPromotionPack): MLPackSummary {
  const details = pack.listing_details ?? [];
  const total = details.reduce((acc, d) => acc + (d.available_listings ?? 0), 0);
  const used = pack.used_listings ?? details.reduce((acc, d) => acc + (d.used_listings ?? 0), 0);
  const remaining = pack.remaining_listings ?? Math.max(0, total - used);

  return {
    id: String(pack.id),
    name: pack.description?.trim() || "Paquete de Mercado Libre",
    kind: pack.package_content === "upgrades" ? "upgrades" : "publications",
    listingTypes: details.map((d) => d.listing_type_id),
    total: Math.max(total, used + remaining),
    used,
    remaining,
    expiresAt: pack.date_expires ?? null,
    autoRenew: pack.engagement_type !== undefined && pack.engagement_type !== "none",
  };
}

/**
 * Paquetes ACTIVOS del vendedor (publicación + destaques) con el cupo sumado.
 * Tira si ML falla: el caller decide cómo mostrarlo.
 */
export async function getMLPacksOverview(
  dealershipId: string,
  mlUserId: string
): Promise<MLPacksOverview> {
  const raw = await mlFetch<MLPromotionPack[]>(
    dealershipId,
    `/users/${encodeURIComponent(mlUserId)}/classifieds_promotion_packs?package_content=ALL`
  );

  const packs = (Array.isArray(raw) ? raw : [])
    .filter((p) => p.status === "active")
    .map(toSummary);

  const upgradesRemaining: MLPacksOverview["upgradesRemaining"] = {};
  for (const pack of raw ?? []) {
    if (pack.status !== "active" || pack.package_content !== "upgrades") continue;
    for (const detail of pack.listing_details ?? []) {
      if (!isMLUpgradeListingType(detail.listing_type_id)) continue;
      const left =
        detail.remaining_listings ??
        Math.max(0, detail.available_listings - (detail.used_listings ?? 0));
      upgradesRemaining[detail.listing_type_id] =
        (upgradesRemaining[detail.listing_type_id] ?? 0) + left;
    }
  }

  return {
    packs,
    publicationsRemaining: packs
      .filter((p) => p.kind === "publications")
      .reduce((acc, p) => acc + p.remaining, 0),
    upgradesRemaining,
  };
}

/**
 * Cambia el listing_type de un aviso ya publicado (destacar o quitar destaque).
 * No genera cobro: consume o libera un lugar del paquete de destaques.
 */
export async function setItemListingType(
  dealershipId: string,
  mlItemId: string,
  listingTypeId: string
): Promise<void> {
  await mlFetch<unknown>(dealershipId, `/items/${encodeURIComponent(mlItemId)}/listing_type`, {
    method: "POST",
    body: JSON.stringify({ id: listingTypeId }),
  });
}
