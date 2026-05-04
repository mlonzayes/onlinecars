export type VehiclePriceTag = "great_price" | "sale" | "low_mileage";

const BADGE_STYLES: Record<VehiclePriceTag, string> = {
  great_price: "bg-emerald-100 text-emerald-800",
  sale: "bg-amber-100 text-amber-900",
  low_mileage: "bg-blue-100 text-blue-800",
};

const PRICE_TAG_LABELS: Record<VehiclePriceTag, string> = {
  great_price: "Gran precio",
  sale: "Oferta",
  low_mileage: "Pocos km",
};

interface VehicleBadgeProps {
  tag: VehiclePriceTag;
  className?: string;
}

export function VehicleBadge({ tag, className = "" }: VehicleBadgeProps) {
  const style = BADGE_STYLES[tag] || "bg-gray-100 text-gray-800";
  const label = PRICE_TAG_LABELS[tag] || tag;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${style} ${className}`}
    >
      {label}
    </span>
  );
}
