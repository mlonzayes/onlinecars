import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDealershipBySlug } from "@/lib/tenant";
import { ReviewForm } from "@/components/tenant/review-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return { title: "No encontrado" };
  return { title: `Dejar Opinión | ${dealership.name}` };
}

export default async function TenantOpinionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[var(--tenant-fg)]">
          Dejanos tu opinión
        </h1>
        <p className="mt-2 text-[var(--tenant-fg-muted)]">
          Tu experiencia nos ayuda a mejorar y a que otros clientes confíen en nosotros.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-6 shadow-sm sm:p-8">
        <ReviewForm slug={slug} dealershipName={dealership.name} />
      </div>
    </div>
  );
}
