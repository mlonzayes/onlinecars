import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ContabilidadPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Contabilidad"
      eta="Q4 2026"
      description="Conectá motorflow con tu sistema contable y AFIP para que cada venta genere automáticamente la documentación fiscal correspondiente."
      features={[
        "Emisión automática de factura electrónica AFIP al cerrar la venta",
        "Integración con Tango Gestión, Xubio y Contabilium",
        "Reportes contables exportables (libro IVA, ventas mensuales)",
        "Conciliación con pagos recibidos",
        "Archivo histórico de comprobantes por cliente y por operación",
      ]}
    />
  );
}
