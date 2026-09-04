import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDealershipBySlug, getTenantPublicUrl } from "@/lib/tenant";
import { Section } from "@/components/tenant/section";
import { QuoteForm } from "@/components/tenant/quote-form";

interface CotizarPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CotizarPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return { title: "No encontrado" };

  // Canonical propio: el layout del tenant declara el suyo (la home) y sin este
  // override esta página le diría a Google que es una copia de la home.
  return {
    title: `Cotizá tu auto | ${dealership.name}`,
    description: `Cotizá tu vehículo usado en ${dealership.name}. Te ofrecemos un precio justo y un proceso simple.`,
    alternates: { canonical: `${getTenantPublicUrl(dealership)}/cotizar` },
  };
}

export default async function CotizarPage({ params }: CotizarPageProps) {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) notFound();

  const whatsappUrl = dealership.whatsapp
    ? `https://wa.me/${dealership.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <Section
      background="muted"
      eyebrow="Vendé tu auto"
      title="Cotizá tu vehículo"
      description="Completá los datos y te contactamos con una propuesta. Es rápido, simple y sin compromiso."
    >
      <div className="mx-auto max-w-3xl">
        <QuoteForm whatsappUrl={whatsappUrl} />
      </div>
    </Section>
  );
}
