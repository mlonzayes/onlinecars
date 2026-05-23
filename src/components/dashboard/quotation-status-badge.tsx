import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuotationStatus } from "@/lib/constants";

const LABELS: Record<QuotationStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
};

const STYLES: Record<QuotationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  accepted: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-700 hover:bg-red-100",
  expired: "bg-gray-200 text-gray-700 hover:bg-gray-200",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <Badge className={cn("text-xs", STYLES[status])}>{LABELS[status]}</Badge>
  );
}
