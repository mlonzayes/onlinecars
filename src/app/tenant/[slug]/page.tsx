import { notFound } from "next/navigation";
import { getTenantHomeBundle, getTenantBasePath } from "@/lib/tenant";
import { TenantHomeContent } from "@/components/tenant/tenant-home-content";

interface TenantHomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { slug } = await params;
  const bundle = await getTenantHomeBundle(slug);
  if (!bundle) notFound();

  const basePath = await getTenantBasePath(slug);

  return <TenantHomeContent bundle={bundle} basePath={basePath} />;
}
