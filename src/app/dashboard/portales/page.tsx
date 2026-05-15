import { redirect } from "next/navigation";
import { MLIntegrationCard } from "@/components/dashboard/settings/ml-integration-card";
import { getCurrentDealership } from "@/lib/auth";
import { getAccountInfo } from "@/lib/mercadolibre/token-store";
import type { MLAccountStatus } from "@/components/dashboard/settings/ml-integration-card";

export default async function PortalesPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/sign-in");

  const account = await getAccountInfo(dealership.id);

  const initialStatus: MLAccountStatus = account
    ? {
        connected: true,
        nickname: account.nickname,
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
