import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/super-admin";
import { WaitlistAdminClient } from "@/components/admin/waitlist-admin-client";

/**
 * /admin/waitlist
 *
 * Panel mínimo para que el super admin gestione los leads del waitlist.
 * Lista todos los entries y permite aprobar (generar invite link).
 * Acceso restringido por SUPER_ADMIN_CLERK_USER_IDS.
 *
 * Esto es deliberadamente sin pulir — alcanza para los primeros 10-20 clientes.
 * Cuando duela manejar volumen, lo escalamos (search, filtros, paginación).
 */
export default async function AdminWaitlistPage() {
  const { userId } = await auth();
  if (!isSuperAdmin(userId)) {
    // No exponer si la ruta existe ni quién es super admin — 404 genérico.
    redirect("/");
  }

  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = entries.map((e) => ({
    id: e.id,
    email: e.email,
    name: e.name,
    dealership: e.dealership,
    phone: e.phone,
    status: e.status,
    inviteToken: e.inviteToken,
    invitedAt: e.invitedAt?.toISOString() ?? null,
    inviteExpiresAt: e.inviteExpiresAt?.toISOString() ?? null,
    acceptedAt: e.acceptedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Waitlist — Admin</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná los leads anotados al waitlist y generá links de invitación.
          </p>
        </div>
        <WaitlistAdminClient entries={serialized} />
      </div>
    </div>
  );
}
