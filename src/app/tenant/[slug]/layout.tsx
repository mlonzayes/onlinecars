import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { getDealershipBySlug } from "@/lib/tenant";
import { TenantHeader } from "@/components/tenant/tenant-header";
import { TenantFooter } from "@/components/tenant/tenant-footer";
import { WhatsAppFab } from "@/components/tenant/whatsapp-fab";
import type { DealershipTheme } from "@/types";

// Poppins: fuente del tenant (decisión de diseño del rediseño).
// Auto-optimized por next/font, expone --font-poppins que usa .tenant-scope en globals.css.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
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

  const basePath = `/tenant/${slug}`;

  return (
    <div
      className={`tenant-scope flex min-h-screen flex-col bg-gray-50 ${poppins.variable}`}
      style={
        {
          "--tenant-primary": primaryColor,
          "--tenant-primary-dark": primaryDark,
        } as React.CSSProperties
      }
    >
      <TenantHeader
        name={dealership.name}
        logo={dealership.logo}
        basePath={basePath}
      />
      <main className="flex-1">{children}</main>
      <TenantFooter
        name={dealership.name}
        description={dealership.description}
        phone={dealership.phone}
        email={dealership.email}
        whatsapp={dealership.whatsapp}
        address={dealership.address}
        city={dealership.city}
        province={dealership.province}
        basePath={basePath}
      />
      {dealership.whatsapp && <WhatsAppFab whatsapp={dealership.whatsapp} />}
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
