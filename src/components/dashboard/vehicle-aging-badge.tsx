import { Clock } from "lucide-react";
import { cn, getDaysInStock } from "@/lib/utils";
import { STOCK_AGING_STALE_DAYS, STOCK_AGING_WATCH_DAYS } from "@/lib/constants";

interface VehicleAgingBadgeProps {
  // Fecha de ingreso al stock (createdAt del vehículo), serializada o Date.
  since: string | Date;
  // El estado del vehículo: no mostramos aging de un auto ya vendido.
  status: string;
  className?: string;
}

// Indica hace cuántos días el vehículo está en stock, con semáforo de alerta
// para detectar inventario "clavado". No renderiza nada si el auto ya se vendió.
export function VehicleAgingBadge({ since, status, className }: VehicleAgingBadgeProps) {
  if (status === "sold") return null;

  const days = getDaysInStock(since);
  const tier =
    days >= STOCK_AGING_STALE_DAYS
      ? "stale"
      : days >= STOCK_AGING_WATCH_DAYS
        ? "watch"
        : "fresh";

  return (
    <span
      className={cn(
        "flex w-fit items-center gap-1 font-medium",
        tier === "fresh" && "text-muted-foreground",
        tier === "watch" && "text-amber-600",
        tier === "stale" && "text-red-600",
        className,
      )}
      title={`En stock hace ${days} ${days === 1 ? "día" : "días"}`}
    >
      <Clock className="h-3 w-3" />
      {days} {days === 1 ? "día" : "días"} en stock
    </span>
  );
}
