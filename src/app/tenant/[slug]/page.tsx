import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import {
  getDealershipBySlug,
  getPublishedVehicles,
  getAvailableBrands,
  getApprovedReviews,
  getDisplayBrands,
} from "@/lib/tenant";
import { Section } from "@/components/tenant/section";
import { HeroSearch } from "@/components/tenant/hero-search";
import { CategoriesGrid } from "@/components/tenant/categories-grid";
import { BrandsGrid } from "@/components/tenant/brands-grid";
import { FeaturedTabs } from "@/components/tenant/featured-tabs";
import { WhyChooseUs } from "@/components/tenant/why-choose-us";
import { DualCTA } from "@/components/tenant/dual-cta";
import { TenantContactForm } from "@/components/tenant/contact-form";
import { ReviewCard } from "@/components/tenant/review-card";
import type { DealershipTheme } from "@/types";

interface TenantHomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) notFound();

  const theme = dealership.theme as DealershipTheme | null;
  const primaryColor = theme?.colorPrimary ?? "#2563eb";

  const [vehicles, stockBrands, reviews, displayBrands] = await Promise.all([
    getPublishedVehicles(dealership.id),
    getAvailableBrands(dealership.id),
    getApprovedReviews(dealership.id),
    getDisplayBrands(dealership.id, theme),
  ]);

  const basePath = `/tenant/${slug}`;

  // Featured primero, después el resto. Limitar a una cantidad razonable para los tabs.
  const featuredVehicles = vehicles.filter((v) => v.featured);
  const otherVehicles = vehicles.filter((v) => !v.featured);
  const candidateVehicles = [...featuredVehicles, ...otherVehicles].slice(0, 18);

  // Serializar Decimal/Date para pasar a Client Components.
  const serializedVehicles = candidateVehicles.map((v) => ({
    id: v.id,
    title: v.title,
    brand: v.brand,
    model: v.model,
    year: v.year,
    price: v.price.toString(),
    currency: v.currency,
    kilometers: v.kilometers,
    fuelType: v.fuelType,
    transmission: v.transmission,
    bodyType: v.bodyType,
    condition: v.condition,
    featured: v.featured,
    images: v.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      alt: img.alt,
    })),
  }));

  return (
    <>
      {/* Hero con search bar */}
      <HeroSearch
        basePath={basePath}
        brands={stockBrands}
        heroType={theme?.heroType ?? "none"}
        heroUrl={theme?.heroUrl ?? null}
        primaryColor={primaryColor}
        headline={`Encontrá tu próximo auto en ${dealership.name}`}
        subhead={
          dealership.description ??
          "Buscá en nuestro stock por marca, condición o presupuesto."
        }
      />

      {/* Categorías por tipo de carrocería */}
      <Section
        background="white"
        eyebrow="Explorá por tipo"
        title="Categorías"
        description="Filtrá rápido por el tipo de vehículo que buscás."
      >
        <CategoriesGrid basePath={basePath} />
      </Section>

      {/* Vehículos destacados con tabs */}
      {serializedVehicles.length > 0 && (
        <Section
          background="muted"
          eyebrow="Lo último en stock"
          title="Nuestros vehículos"
          description="Una selección curada de la mejor parte de nuestro inventario."
        >
          <FeaturedTabs vehicles={serializedVehicles} basePath={basePath} />
        </Section>
      )}

      {/* Marcas que trabajamos */}
      {displayBrands.length > 0 && (
        <Section
          background="white"
          eyebrow="Trabajamos con las mejores"
          title="Marcas premium"
          description="Acceso directo a las marcas más buscadas del mercado."
        >
          <BrandsGrid brands={displayBrands} basePath={basePath} />
        </Section>
      )}

      {/* Doble CTA: comprar (catálogo) o vender (cotización) */}
      <Section background="white" padding="tight">
        <DualCTA basePath={basePath} />
      </Section>

      {/* Why Choose Us */}
      <Section
        background="muted"
        eyebrow="Por qué elegirnos"
        title="Cuidamos cada detalle"
        description="No vendemos solo autos. Acompañamos toda la operación."
      >
        <WhyChooseUs />
      </Section>

      {/* Opiniones */}
      <Section
        background="white"
        id="opiniones"
        eyebrow="Lo que dicen nuestros clientes"
        title="Opiniones reales"
      >
        <div className="flex justify-center pb-6">
          <Link
            href={`${basePath}/opinion`}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <MessageSquareQuote className="h-4 w-4" />
            Dejar mi opinión
          </Link>
        </div>

        {reviews.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              Aún no hay opiniones públicas
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sé el primero en compartir tu experiencia.
            </p>
          </div>
        )}
      </Section>

      {/* Contacto */}
      <Section
        background="muted"
        id="contacto"
        eyebrow="Estamos para ayudarte"
        title="¿Tenés alguna consulta?"
        description="Escribinos y te respondemos a la brevedad."
      >
        <div className="mx-auto max-w-2xl">
          <TenantContactForm slug={slug} />
        </div>
      </Section>
    </>
  );
}
