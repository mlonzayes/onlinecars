import { Calculator } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function CotizacionesPage() {
  return (
    <ComingSoon
      icon={Calculator}
      title="Cotizaciones"
      eta="Q1 2026"
      description="Asistente de tasación para acelerar la cotización de usados que recibís en parte de pago, con datos de mercado en tiempo real."
      features={[
        "Estimación automática de valor de mercado por marca, modelo y año",
        "Histórico de cotizaciones por cliente",
        "Comparativa con autos similares publicados",
        "Generación de cotización en PDF para enviar al cliente",
        "Integración con tu pipeline de leads",
      ]}
    />
  );
}
