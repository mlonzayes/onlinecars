// Tipos de publicación de ML para vehículos. Client-safe: sin imports de server.

// Publicar siempre con este: consume un lugar del paquete de publicación.
export const ML_PUBLISH_LISTING_TYPE = "silver";

// Destaques: consumen un lugar del paquete de destaques.
export const ML_UPGRADE_LISTING_TYPES = ["gold", "gold_premium"] as const;
export type MLUpgradeListingType = (typeof ML_UPGRADE_LISTING_TYPES)[number];

export const ML_LISTING_TYPE_LABELS: Record<string, string> = {
  silver: "Plata",
  gold: "Oro",
  gold_premium: "Oro Premium",
};

export function isMLUpgradeListingType(value: string): value is MLUpgradeListingType {
  return (ML_UPGRADE_LISTING_TYPES as readonly string[]).includes(value);
}
