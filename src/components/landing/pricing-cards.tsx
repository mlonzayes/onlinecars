"use client";

import { PiCheck } from "react-icons/pi";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    key: "base",
    name: "Base",
    price: "$19.990",
    features: ["Sitio web propio", "Hasta 30 vehículos", "CRM básico", "1 usuario"],
    highlighted: false,
    ctaText: "Empezar",
  },
  {
    key: "media",
    name: "Media",
    price: "$49.990",
    features: ["Sitio web propio", "Hasta 100 vehículos", "Integración Meli", "WhatsApp bot"],
    highlighted: true,
    highlightLabel: "Más elegida",
    ctaText: "Empezar",
  },
  {
    key: "premium",
    name: "Premium",
    price: "$99.990",
    features: ["Stock ilimitado", "Onboarding asistido", "Múltiples usuarios", "Soporte prioritario"],
    highlighted: false,
    ctaText: "Empezar",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "A medida",
    features: ["Stock ilimitado", "Account manager dedicado", "SLA garantizado", "Desarrollo a medida"],
    highlighted: false,
    ctaText: "Hablemos",
  },
];

export function PricingCards() {
  const router = useRouter();

  const handleStart = (planKey: string) => {
    // Guardar plan en cookie (ej: selected_plan_id)
    document.cookie = `selected_plan_id=${planKey}; path=/; max-age=3600`;
    // Redirigir al formulario de contacto
    router.push("#contacto");
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-800">
          * Estos precios son de promoción por los primeros 6 meses
        </span>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex flex-col h-full rounded-2xl border p-6 shadow-sm transition-transform hover:-translate-y-1 ${
              plan.highlighted ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-white"
            }`}
          >
          {plan.highlighted && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                {plan.highlightLabel}
              </span>
            </div>
          )}
          <h3 className={`text-lg font-bold ${plan.highlighted ? "text-blue-700" : "text-gray-900"}`}>
            {plan.name}
          </h3>
          <div className="mt-4">
            {plan.key === "enterprise" ? (
              <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
            ) : (
              <>
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-sm font-medium text-gray-500">/mes</span>
              </>
            )}
          </div>
          <ul className="mt-8 flex-1 space-y-4">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start">
                <PiCheck className={`mr-3 h-5 w-5 shrink-0 ${plan.highlighted ? "text-blue-600" : "text-green-500"}`} />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
            {plan.key !== "enterprise" && (
              <li className="flex items-start">
                <PiCheck className={`mr-3 h-5 w-5 shrink-0 ${plan.highlighted ? "text-blue-600" : "text-green-500"}`} />
                <span className="text-sm text-gray-700 italic">Potenciado por motorflow</span>
              </li>
            )}
          </ul>
          <div className="mt-auto pt-8 flex flex-col gap-3">
            <button
              onClick={() => handleStart(plan.key)}
              className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
                plan.highlighted
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {plan.ctaText}
            </button>
            {plan.key !== "enterprise" && (
              <p className="text-center text-xs text-gray-500">
                15 días de prueba gratuita
              </p>
            )}
            <Link
              href="/precios"
              target="_blank"
              className="text-center text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              Saber más
            </Link>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
