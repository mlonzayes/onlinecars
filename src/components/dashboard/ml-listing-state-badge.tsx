import { Badge } from "@/components/ui/badge";
import { isMLUpgradeListingType, ML_LISTING_TYPE_LABELS } from "@/lib/mercadolibre/listing-types";

const STATE_LABEL: Record<string, string> = {
  active: "Publicado",
  paused: "Pausado",
  payment_required: "Pendiente de pago",
  error: "Con error",
};

interface Props {
  listing: { status: string; listingTypeId: string } | null;
}

/** Estado del vehículo en ML. Un listing cerrado cuenta como "sin publicar". */
export function MLListingStateBadge({ listing }: Props) {
  if (!listing || listing.status === "closed") {
    return <span className="text-sm text-muted-foreground">Sin publicar</span>;
  }

  const isUpgraded = isMLUpgradeListingType(listing.listingTypeId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={listing.status === "error" ? "destructive" : "secondary"}>
        {STATE_LABEL[listing.status] ?? listing.status}
      </Badge>
      {isUpgraded && (
        <Badge variant="outline">{ML_LISTING_TYPE_LABELS[listing.listingTypeId]}</Badge>
      )}
    </div>
  );
}
