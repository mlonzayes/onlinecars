import { notFound } from "next/navigation";
import { getTenantHomeBundle, getTenantBasePath } from "@/lib/tenant";
import { SectionRenderer } from "@/components/tenant/section-renderer";

interface TenantHomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { slug } = await params;
  const bundle = await getTenantHomeBundle(slug);
  if (!bundle) notFound();

  const basePath = await getTenantBasePath(slug);

  // Las secciones ya vienen ordenadas por `order asc` desde el bundle.
  // El dispatcher se ocupa de filtrar las deshabilitadas y de matchear cada
  // type con su componente.
  return (
    <>
      {bundle.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          bundle={bundle}
          basePath={basePath}
        />
      ))}
    </>
  );
}
