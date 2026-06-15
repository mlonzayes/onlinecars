import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDealershipBySlug, getTenantBasePath } from "@/lib/tenant";
import { TenantChrome } from "@/components/tenant/tenant-chrome";

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

  const basePath = await getTenantBasePath(slug);

  return (
    <TenantChrome dealership={dealership} basePath={basePath}>
      {children}
    </TenantChrome>
  );
}
