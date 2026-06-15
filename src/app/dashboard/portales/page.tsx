import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { MLIntegrationCard } from "@/components/dashboard/settings/ml-integration-card";
import { getCurrentDealership } from "@/lib/auth";
import { getAccountInfo } from "@/lib/mercadolibre/token-store";
import { getPlanLimits } from "@/lib/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MLAccountStatus } from "@/components/dashboard/settings/ml-integration-card";

export default async function PortalesPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/sign-in");

  const limits = getPlanLimits(dealership);

  // Plan no permite ML: mostramos upgrade banner en vez del card de conexión.
  // Defense in depth: la UI ya esconde el botón en otras partes y los endpoints
  // del backend bloquean (403). Acá redondeamos la experiencia con un CTA claro.
  if (!limits.allowMLIntegration) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Portales</h1>
          <p className="text-muted-foreground">
            Publicá tu stock en los principales marketplaces de autos del país desde un solo lugar.
          </p>
        </div>

        <Card className="relative overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Mercado Libre
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    <Sparkles className="h-3 w-3" />
                    Plan Media
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Conectá tu cuenta y publicá tu stock automáticamente en Mercado Libre.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-foreground/90">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
                Publicación con 1 click desde el dashboard.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
                Sincronización automática del estado (pausar, reactivar, cerrar).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
                Leads de Mercado Libre integrados con tu CRM de consultas.
              </li>
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard/configuracion?section=plan"
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Mejorá tu plan
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Volver al dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const account = await getAccountInfo(dealership.id);

  const initialStatus: MLAccountStatus = account
    ? {
        connected: true,
        nickname: account.nickname ?? undefined,
        mlUserId: account.mlUserId,
        connectedAt: account.createdAt.toISOString(),
        tokenExpiresSoon:
          account.expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000,
      }
    : { connected: false };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Portales</h1>
        <p className="text-muted-foreground">
          Publicá tu stock en los principales marketplaces de autos del país desde un solo lugar.
        </p>
      </div>

      <div className="space-y-4">
        <MLIntegrationCard initialStatus={initialStatus} />
      </div>
    </div>
  );
}
