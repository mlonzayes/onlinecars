import { ShieldCheck, Banknote, BadgePercent, Wrench } from "lucide-react";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// Set fijo del template — el dealer no las edita por ahora.
// Si más adelante se quieren personalizables, mover a `theme.features` en el modelo.
const FEATURES: Feature[] = [
  {
    icon: Banknote,
    title: "Financiación a tu medida",
    description: "Te ayudamos a armar el plan que se adapta a tu presupuesto.",
  },
  {
    icon: ShieldCheck,
    title: "Vehículos verificados",
    description: "Cada unidad pasa por una inspección técnica antes de salir al stock.",
  },
  {
    icon: BadgePercent,
    title: "Precios competitivos",
    description: "Precios actualizados al mercado, sin sorpresas ni costos ocultos.",
  },
  {
    icon: Wrench,
    title: "Servicio post-venta",
    description: "Soporte después de la compra. No te dejamos solo en la calle.",
  },
];

export function WhyChooseUs() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            className="flex flex-col items-start rounded-xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-[var(--tenant-fg)]">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--tenant-fg-muted)]">
              {feature.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
