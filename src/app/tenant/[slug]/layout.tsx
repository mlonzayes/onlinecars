import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDealershipBySlug, getTenantBasePath } from "@/lib/tenant";
import { resolveTemplate } from "@/lib/tenant-templates";
import { TenantHeader } from "@/components/tenant/tenant-header";
import { TenantFooter } from "@/components/tenant/tenant-footer";
import { WhatsAppFab } from "@/components/tenant/whatsapp-fab";
import { getPlanLimits } from "@/lib/plans";
import type { DealershipTheme } from "@/types";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);

  if (!dealership) return { title: "No encontrado" };

  const title = `${dealership.name} — Vehículos`;
  const description =
    dealership.description ??
    `Explorá los vehículos de ${dealership.name}. Encontrá tu próximo auto.`;

  // Favicon dinámico por tenant: usamos el logo del concesionario si está cargado.
  // Si no hay logo, no devolvemos `icons` y el favicon del root (motorflow) toma
  // por default — preferible a un favicon roto.
  const icons = dealership.logo
    ? { icon: dealership.logo, shortcut: dealership.logo, apple: dealership.logo }
    : undefined;

  return {
    title,
    description,
    icons,
    openGraph: {
      title,
      description,
      type: "website",
      ...(dealership.logo ? { images: [dealership.logo] } : {}),
    },
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);

  if (!dealership) notFound();

  const theme = dealership.theme as DealershipTheme | null;
  const primaryColor = theme?.colorPrimary ?? "#2563eb";
  const primaryDark = adjustBrightness(primaryColor, -20);

  // Resolve template — el helper hace fallback a "classic" si el id no es válido.
  const template = resolveTemplate(dealership.templateId);

  const basePath = await getTenantBasePath(slug);

  return (
    <div
      // bg-[var(--tenant-bg)] + text-[var(--tenant-fg)] aplican los tokens
      // del template seleccionado a toda la subtree. data-template está para
      // estilos extra que necesiten condicionales por id (raro pero útil).
      data-template={template.id}
      data-tone={template.tone}
      className={`tenant-scope flex min-h-screen flex-col bg-[var(--tenant-bg)] text-[var(--tenant-fg)] ${template.font.variable}`}
      style={
        {
          "--tenant-primary": primaryColor,
          "--tenant-primary-dark": primaryDark,
          ...template.tokens,
        } as React.CSSProperties
      }
    >
      <TenantHeader
        name={dealership.name}
        logo={dealership.logo}
        basePath={basePath}
      />
      {/* pt-24 reserva espacio para el navbar flotante en TODAS las páginas.
          El hero de la home se desfasa con -mt-24 para correr DETRÁS del nav
          y dar el efecto inmersivo (ver hero-search.tsx). */}
      <main className="flex-1 pt-24">{children}</main>
      <TenantFooter
        name={dealership.name}
        logo={dealership.logo}
        description={dealership.description}
        phone={dealership.phone}
        email={dealership.email}
        whatsapp={dealership.whatsapp}
        address={dealership.address}
        city={dealership.city}
        province={dealership.province}
        basePath={basePath}
        showPoweredBy={getPlanLimits(dealership).showPoweredBy}
      />
      {/* FAB de WhatsApp: requiere TRES condiciones simultáneas:
            1) El dealer cargó un número (dealership.whatsapp)
            2) El dealer activó el toggle en el admin (whatsappFabEnabled)
            3) El plan permite la feature (allowWhatsappFab)
          Si una falla, el FAB no renderiza. */}
      {dealership.whatsapp &&
        dealership.whatsappFabEnabled &&
        getPlanLimits(dealership).allowWhatsappFab && (
          <WhatsAppFab
            whatsapp={dealership.whatsapp}
            message={dealership.whatsappMessage}
          />
        )}
    </div>
  );
}

/**
 * Ajusta el brillo de un color hex.
 * amount positivo = más claro, negativo = más oscuro.
 */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
