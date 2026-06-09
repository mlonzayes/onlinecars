import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import { Section } from "./section";
import { ReviewCard } from "./review-card";
import { AnimateOnScroll } from "./animate-on-scroll";
import type {
  TenantHomeBundleReview,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import type { ReviewsConfig } from "@/lib/sections/config-types";

interface ReviewsSectionProps {
  section: TenantHomeBundleSection;
  reviews: TenantHomeBundleReview[];
  basePath: string;
}

// Sección "Opiniones". Mantiene el bloque que vivía hardcoded en page.tsx:
// CTA arriba para dejar opinión + grid de reviews aprobadas (o placeholder vacío).
export function ReviewsSection({ section, reviews, basePath }: ReviewsSectionProps) {
  const config = section.config as ReviewsConfig;
  const visible = reviews.slice(0, config.maxItems);

  return (
    <Section
      background="white"
      id="opiniones"
      eyebrow="Lo que dicen nuestros clientes"
      title={section.title}
    >
      <AnimateOnScroll preset="fadeUp">
        {config.showCta && (
          <div className="flex justify-center pb-6">
            <Link
              href={`${basePath}/opinion`}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <MessageSquareQuote className="h-4 w-4" />
              Dejar mi opinión
            </Link>
          </div>
        )}

        {visible.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[var(--tenant-border)] bg-[var(--tenant-bg)] p-10 text-center">
            <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-[var(--tenant-fg)]">
              Aún no hay opiniones públicas
            </p>
            <p className="mt-1 text-xs text-[var(--tenant-fg-muted)]">
              Sé el primero en compartir tu experiencia.
            </p>
          </div>
        )}
      </AnimateOnScroll>
    </Section>
  );
}
