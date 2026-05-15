import { Landmark } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function BancosPage() {
  return (
    <ComingSoon
      icon={Landmark}
      title="Bancos y financiación"
      eta="Q3 2026"
      description="Cotizá planes de financiación con bancos integrados directamente desde la ficha del auto, sin intermediarios ni llamados."
      features={[
        "Integración con Banco Galicia, Santander, BBVA, Macro y Nación",
        "Cotización de cuotas en tiempo real desde la ficha del vehículo",
        "Pre-aprobación de créditos prendarios",
        "Comparativa entre bancos para que el cliente elija el mejor plan",
        "Seguimiento del estado del crédito hasta su aprobación",
      ]}
    />
  );
}
