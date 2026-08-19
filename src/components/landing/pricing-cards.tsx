"use client";

import { PiCheck } from "react-icons/pi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlanCtaHref, rememberSelectedPlan } from "@/lib/pricing-cta";

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
    rememberSelectedPlan(planKey);
    router.push(getPlanCtaHref(planKey));
  };

  return (
    <div className="w-full">
      <div className="mb-10 text-center">
        <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600">
          15 días de prueba gratuita
        </span>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex h-full flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 ${
              plan.highlighted
                ? "border border-blue-500 bg-white shadow-lg shadow-blue-100/60"
                : "border border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium tracking-wide text-white">
                  {plan.highlightLabel}
                </span>
              </div>
            )}

            <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-gray-900">{plan.price}</span>
              {plan.key !== "enterprise" && (
                <span className="text-sm font-light text-gray-500">/mes</span>
              )}
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <PiCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="text-sm font-light text-gray-600">{feature}</span>
                </li>
              ))}
              {plan.key !== "enterprise" && (
                <li className="flex items-start gap-2.5">
                  <PiCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="text-sm font-light italic text-gray-500">
                    Potenciado por motorflow
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => handleStart(plan.key)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 text-gray-900 hover:border-gray-900"
                }`}
              >
                {plan.ctaText}
              </button>
              <Link
                href="/precios"
                target="_blank"
                className="text-center text-xs font-medium text-gray-500 transition hover:text-gray-900"
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
