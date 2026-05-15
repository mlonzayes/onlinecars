import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function PagosPage() {
  return (
    <ComingSoon
      icon={CreditCard}
      title="Pagos"
      eta="Q2 2026"
      description="Cobrá señas y pagos de tus ventas online, sin que el cliente tenga que ir al banco ni transferir manualmente."
      features={[
        "Cobro de señas con MercadoPago y otras pasarelas",
        "Link de pago automático generado desde la venta",
        "Notificación al cliente y al concesionario al confirmarse el pago",
        "Conciliación automática con el módulo de ventas",
        "Historial de transacciones por venta y por cliente",
      ]}
    />
  );
}
