"use client";

import { PiCheck } from "react-icons/pi";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlanCtaHref, rememberSelectedPlan } from "@/lib/pricing-cta";
import { cn } from "@/lib/utils";

// Features alineadas con PLAN_LIMITS de src/lib/plans.ts. Si cambia un límite
// ahí, cambia acá: prometer algo que el plan no habilita es un ticket seguro
// (pasó con "WhatsApp bot", que nunca existió: lo que hay es el botón flotante).
// Sello de motorflow: según el negocio, solo Enterprise va sin él. OJO: hoy
// PLAN_LIMITS.media/premium tienen showPoweredBy=false; alinear plans.ts.
const PLANS = [
  {
    key: "base",
    name: "Base",
    price: "$19.990",
    features: ["Tu web con tu logo", "Hasta 30 autos", "IA: 20 pedidos por día", "1 usuario"],
    highlighted: false,
    ctaText: "Probar gratis",
  },
  {
    key: "media",
    name: "Media",
    price: "$49.990",
    features: ["Hasta 100 autos", "3 usuarios", "IA sin límite", "Mercado Libre", "WhatsApp, Meta y Clarity"],
    highlighted: true,
    ctaText: "Probar gratis",
  },
  {
    key: "premium",
    name: "Premium",
    price: "$99.990",
    features: ["Autos ilimitados", "Usuarios ilimitados", "Todo lo de Media", "Soporte prioritario"],
    highlighted: false,
    ctaText: "Probar gratis",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "A medida",
    features: ["Sin sello de motorflow", "Account manager", "Desarrollo a medida"],
    highlighted: false,
    ctaText: "Contactanos",
  },
];

export function PricingCards() {
  const router = useRouter();

  const handleStart = (planKey: string) => {
    rememberSelectedPlan(planKey);
    router.push(getPlanCtaHref(planKey));
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan) => (
        <div
          key={plan.key}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-white p-6",
            plan.highlighted ? "border-brand shadow-xl shadow-brand/10" : "border-ink/10"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-normal text-ink">{plan.name}</h3>
            {plan.highlighted && <Badge className="bg-brand font-normal text-white">Recomendado</Badge>}
          </div>

          <p className="mt-3 flex items-baseline gap-1">
            <span className={cn("font-display text-3xl font-light", plan.highlighted ? "text-brand" : "text-ink")}>
              {plan.price}
            </span>
            {plan.key !== "enterprise" && <span className="text-sm text-ink-soft">/mes</span>}
          </p>

          <ul className="mt-6 flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                <PiCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant={plan.highlighted ? "default" : "outline"}
            onClick={() => handleStart(plan.key)}
            className={cn(
              "mt-8 h-11 w-full text-sm",
              plan.highlighted
                ? "bg-brand text-white hover:bg-brand-deep"
                : "border-ink/15 bg-white text-ink hover:bg-paper"
            )}
          >
            {plan.ctaText}
          </Button>
        </div>
      ))}
    </div>
  );
}
