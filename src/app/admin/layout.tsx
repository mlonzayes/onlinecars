import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/super-admin";
import { AdminNav } from "@/components/admin/admin-nav";

// Panel interno: nunca indexable.
export const metadata: Metadata = {
  title: "Panel de plataforma",
  robots: { index: false, follow: false },
};

/**
 * Layout del panel de plataforma (super-admin). El guard vive acá para cubrir
 * TODAS las subrutas de /admin de una — una page nueva no puede olvidarse de
 * chequear. Las pages igual repiten el guard: son cross-tenant, defense in depth.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  // notFound (no 403) para no revelar que la ruta existe a un usuario logueado.
  if (!isSuperAdmin(userId)) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Todas las cuentas de motorflow.
        </p>
      </div>

      <AdminNav />

      {children}
    </div>
  );
}
