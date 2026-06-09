import Link from "next/link";
import { Banknote, ArrowRight } from "lucide-react";
import { Section } from "./section";
import { AnimateOnScroll } from "./animate-on-scroll";
import type { TenantHomeBundleSection } from "@/lib/tenant";
import type { FinancingConfig } from "@/lib/sections/config-types";

interface FinancingSectionProps {
  section: TenantHomeBundleSection;
  basePath: string;
}

// Sección "Financiación". El modelo de planes administrables todavía no está
// integrado al builder — por ahora mostramos un placeholder con el copy editable
// y un CTA opcional al simulador / contacto.
export function FinancingSection({ section, basePath }: FinancingSectionProps) {
  const config = section.config as FinancingConfig;

  return (
    <Section
      background="white"
      id="financiacion"
      eyebrow="Financiación"
      title={section.title}
      description={section.subtitle ?? undefined}
    >
      <AnimateOnScroll
        preset="fadeUp"
        className="mx-auto max-w-3xl rounded-3xl border border-[var(--tenant-border)] bg-[var(--tenant-bg)] p-8 text-center sm:p-12"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]">
          <Banknote className="h-7 w-7" />
        </div>

        {section.content ? (
          <p className="mx-auto max-w-2xl whitespace-pre-line text-base leading-relaxed text-[var(--tenant-fg)]">
            {section.content}
          </p>
        ) : (
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--tenant-fg)]">
            Estamos preparando los planes de financiación. Mientras tanto, contactanos
            y te armamos una propuesta a medida.
          </p>
        )}

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--tenant-fg-subtle)]">
          Próximamente — planes administrables
        </p>

        {config.showCalculatorCta && (
          <Link
            href={`${basePath}/cotizar`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--tenant-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Simular financiación
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </AnimateOnScroll>
    </Section>
  );
}
