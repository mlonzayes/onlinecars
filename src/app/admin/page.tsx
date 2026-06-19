import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/super-admin";
import { getPlatformData } from "@/lib/admin-stats";
import { AccountsTable } from "@/components/admin/accounts-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// Panel de plataforma (super-admin). Cross-tenant: solo el dueño de motorflow.
export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  // notFound (no 403) para no revelar que la ruta existe a un usuario logueado.
  if (!isSuperAdmin(userId)) notFound();

  const { accounts, summary } = await getPlatformData();

  // Trials ordenados por días restantes ascendente: los más urgentes primero.
  // Incluye los ya vencidos no marcados aún por el cron (días ≤ 0).
  const trials = accounts
    .filter((a) => a.subscriptionStatus === "trial")
    .sort((x, y) => (x.trialDaysLeft ?? Infinity) - (y.trialDaysLeft ?? Infinity));

  const summaryCards = [
    { label: "Total cuentas", value: summary.total },
    { label: "En trial", value: summary.trial },
    { label: "Activas", value: summary.active },
    { label: "Vencidas", value: summary.expired },
    { label: "Suspendidas", value: summary.suspended },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Todas las cuentas de motorflow.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
          <h2 className="text-lg font-semibold">Trials por vencer</h2>
          <p className="text-sm text-muted-foreground">
            Ordenados por urgencia. Contactá a los de arriba para venderles un plan.
          </p>
        </div>
        <AccountsTable accounts={trials} emptyLabel="No hay cuentas en trial." />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Todas las cuentas</h2>
        <AccountsTable accounts={accounts} />
      </section>
    </div>
  );
}
