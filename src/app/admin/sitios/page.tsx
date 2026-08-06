import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/super-admin";
import { getPlatformData } from "@/lib/admin-stats";
import { SitesTable } from "@/components/admin/sites-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// Control de los sitios públicos de todas las cuentas. El guard vive en el
// layout; lo repetimos acá porque la query es cross-tenant (defense in depth).
export default async function AdminSitesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isSuperAdmin(userId)) notFound();

  const { accounts, summary } = await getPlatformData();

  // Los pausados arriba: son los que requieren una acción tuya (revisar el
  // sitio y prenderlo). Dentro de cada grupo se mantiene el orden por fecha.
  const paused = accounts.filter((a) => !a.siteEnabled || !a.active);
  const live = accounts.filter((a) => a.siteEnabled && a.active);

  const summaryCards = [
    { label: "Sitios online", value: summary.sitesLive },
    { label: "Pausados", value: summary.sitesPaused },
    { label: "Total cuentas", value: summary.total },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardDescription>{s.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Sitios pausados</h2>
          <p className="text-sm text-muted-foreground">
            No responden al público. Revisá la vista previa y activalos cuando estén
            listos.
          </p>
        </div>
        <SitesTable accounts={paused} emptyLabel="Todos los sitios están online." />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Sitios online</h2>
          <p className="text-sm text-muted-foreground">
            Visibles en su subdominio. Pausar uno lo deja en 404 al instante.
          </p>
        </div>
        <SitesTable accounts={live} emptyLabel="Todavía no hay ningún sitio online." />
      </section>
    </div>
  );
}
