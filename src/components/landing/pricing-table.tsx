"use client";

import { PiCheck, PiMinus } from "react-icons/pi";

interface PlanCol {
  key: "base" | "media" | "premium" | "enterprise";
  name: string;
  /** Precio promo de lanzamiento en ARS, o null si es "Hablemos" (enterprise) */
  promoPriceArs: number | null;
  /** Precio de tabla (sin promo). Se muestra tachado arriba del promo. */
  fullPriceArs: number | null;
  tagline: string;
  highlighted?: boolean;
  highlightLabel?: string;
  ctaHref: string;
  ctaLabel: string;
}

/** Valor de una celda: true=check, false=dash, string=texto literal. */
type CellValue = boolean | string;

interface FeatureRow {
  label: string;
  /** Texto auxiliar más chico debajo del label (opcional). */
  hint?: string;
  values: Record<PlanCol["key"], CellValue>;
}

interface FeatureGroup {
  title: string;
  rows: FeatureRow[];
}

const PLANS: PlanCol[] = [
  {
    key: "base",
    name: "Base",
    promoPriceArs: 19990,
    fullPriceArs: 34990,
    tagline: "Para arrancar con presencia online.",
    ctaHref: "#contacto",
    ctaLabel: "Anotarme",
  },
  {
    key: "media",
    name: "Media",
    promoPriceArs: 49990,
    fullPriceArs: 74990,
    tagline: "Para concesionarios en crecimiento.",
    highlighted: true,
    highlightLabel: "Más elegida",
    ctaHref: "#contacto",
    ctaLabel: "Anotarme",
  },
  {
    key: "premium",
    name: "Premium",
    promoPriceArs: 99990,
    fullPriceArs: 129990,
    tagline: "Para operación media y alta.",
    ctaHref: "#contacto",
    ctaLabel: "Anotarme",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    promoPriceArs: null,
    fullPriceArs: null,
    tagline: "Soluciones a medida.",
    ctaHref: "#contacto",
    ctaLabel: "Hablemos",
  },
];

const GROUPS: FeatureGroup[] = [
  {
    title: "Límites",
    rows: [
      {
        label: "Vehículos publicados",
        hint: "Solo cuentan los que están publicados en tu sitio.",
        values: { base: "30", media: "100", premium: "Ilimitados", enterprise: "Ilimitados" },
      },
      {
        label: "Fotos por vehículo",
        hint: "Vender autos online es vender fotos.",
        values: { base: "8", media: "15", premium: "Ilimitadas", enterprise: "Ilimitadas" },
      },
      {
        label: "Usuarios del panel",
        values: { base: "1", media: "3", premium: "Ilimitados", enterprise: "Ilimitados" },
      },
      {
        label: "Clientes en el CRM",
        hint: "Sin tope. Tu histórico operativo es tuyo, no del plan.",
        values: { base: "Ilimitados", media: "Ilimitados", premium: "Ilimitados", enterprise: "Ilimitados" },
      },
    ],
  },
  {
    title: "Lo que incluye",
    rows: [
      {
        label: "Sitio web propio con tu marca",
        values: { base: true, media: true, premium: true, enterprise: true },
      },
      {
        label: "CRM de leads, clientes y ventas",
        values: { base: true, media: true, premium: true, enterprise: true },
      },
      {
        label: "Legajo digital de documentos",
        values: { base: true, media: true, premium: true, enterprise: true },
      },
      {
        label: "Cotizaciones para clientes",
        values: { base: true, media: true, premium: true, enterprise: true },
      },
      {
        label: "Opiniones públicas de clientes",
        values: { base: true, media: true, premium: true, enterprise: true },
      },
      {
        label: "Acciones masivas",
        hint: "Editar, publicar o eliminar varios vehículos a la vez.",
        values: { base: false, media: true, premium: true, enterprise: true },
      },
      {
        label: "Integración con Mercado Libre",
        hint: "Publicá tu stock con 1 click. Costo de publicación a cargo del concesionario.",
        values: { base: false, media: true, premium: true, enterprise: true },
      },
      {
        label: "Botón flotante de WhatsApp",
        hint: "Tus visitantes te escriben directo desde el sitio.",
        values: { base: false, media: true, premium: true, enterprise: true },
      },
      {
        label: "Sin marca de motorflow",
        hint: "En Base mostramos 'Potenciado por motorflow' en el footer de tu sitio.",
        values: { base: false, media: true, premium: true, enterprise: true },
      },
    ],
  },
  {
    title: "Soporte",
    rows: [
      {
        label: "Soporte",
        values: {
          base: "Email",
          media: "Prioritario",
          premium: "Prioritario",
          enterprise: "Dedicado 24/7",
        },
      },
      {
        label: "Onboarding asistido",
        hint: "Te ayudamos a cargar tu stock y configurar tu sitio.",
        values: { base: false, media: false, premium: true, enterprise: true },
      },
      {
        label: "SLA garantizado",
        values: { base: false, media: false, premium: false, enterprise: true },
      },
      {
        label: "Account manager dedicado",
        values: { base: false, media: false, premium: false, enterprise: true },
      },
    ],
  },
];

function formatArs(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

function Cell({ value, highlighted }: { value: CellValue; highlighted: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-50">
        <PiCheck className={`h-3.5 w-3.5 ${highlighted ? "text-blue-600" : "text-green-600"}`} />
      </span>
    );
  }
  if (value === false) {
    return <PiMinus className="h-4 w-4 text-gray-300" aria-label="No incluido" />;
  }
  return (
    <span
      className={`text-sm font-semibold ${highlighted ? "text-blue-700" : "text-gray-900"}`}
    >
      {value}
    </span>
  );
}

export function PricingTable() {
  return (
    <div className="relative">
      {/* Hint de scroll en mobile — visible solo bajo md cuando la tabla overflowea. */}
      <p className="mb-3 text-center text-[11px] text-gray-400 md:hidden">
        Deslizá para comparar →
      </p>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] table-fixed border-collapse text-left">
          <thead>
            <tr>
              {/* Esquina vacía sobre la columna de labels */}
              <th
                scope="col"
                className="sticky left-0 z-10 w-1/3 min-w-[200px] bg-white px-5 pt-8 pb-5 align-bottom"
              >
                <span className="sr-only">Features</span>
              </th>
              {PLANS.map((plan) => {
                const isHighlighted = !!plan.highlighted;
                return (
                  <th
                    key={plan.key}
                    scope="col"
                    className={`relative h-full w-1/6 min-w-[150px] p-0 align-top ${
                      isHighlighted ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <div className="flex h-full flex-col px-4 pt-8 pb-5">
                      {isHighlighted && (
                        <div className="absolute top-0 left-0 right-0 flex justify-center">
                          <span className="rounded-b-md bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            {plan.highlightLabel ?? "Más elegida"}
                          </span>
                        </div>
                      )}
                      <div
                        className={`text-base font-bold ${
                          isHighlighted ? "text-blue-700" : "text-gray-900"
                        }`}
                      >
                        {plan.name}
                      </div>
                      <div className="mt-1 min-h-[32px] text-[11px] leading-snug text-gray-500">
                        {plan.tagline}
                      </div>
                      <div className="mt-3">
                        {plan.promoPriceArs === null || plan.fullPriceArs === null ? (
                          <span className="text-2xl font-extrabold text-gray-900">Hablemos</span>
                        ) : (
                          <>
                            {/* Tachado: precio "de tabla" arriba en chico */}
                            <div className="text-[11px] font-medium text-gray-400 line-through">
                              ${formatArs(plan.fullPriceArs)} / mes
                            </div>
                            <div>
                              <span className="text-2xl font-extrabold text-gray-900">
                                ${formatArs(plan.promoPriceArs)}
                              </span>
                              <span className="ml-1 text-xs font-medium text-gray-500">/ mes</span>
                            </div>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  isHighlighted
                                    ? "bg-blue-600 text-white"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                Promo lanzamiento
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-auto pt-4">
                        <a
                          href={plan.ctaHref}
                          className={`inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isHighlighted
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "border border-gray-300 text-gray-900 hover:border-gray-900"
                          }`}
                        >
                          {plan.ctaLabel}
                        </a>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {GROUPS.map((group) => (
              <GroupRows key={group.title} group={group} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({ group }: { group: FeatureGroup }) {
  return (
    <>
      <tr>
        <td
          colSpan={5}
          className="sticky left-0 border-y border-gray-200 bg-gray-50 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500"
        >
          {group.title}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.label} className="border-t border-gray-100">
          <th
            scope="row"
            className="sticky left-0 z-[1] bg-white px-5 py-3 text-left align-top text-sm font-medium text-gray-900"
          >
            {row.label}
            {row.hint && <p className="mt-0.5 text-[11px] font-normal text-gray-500">{row.hint}</p>}
          </th>
          {PLANS.map((plan) => {
            const isHighlighted = !!plan.highlighted;
            return (
              <td
                key={plan.key}
                className={`px-4 py-3 align-top ${isHighlighted ? "bg-blue-50/40" : ""}`}
              >
                <Cell value={row.values[plan.key]} highlighted={isHighlighted} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
