import { getCurrentDealership } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/dashboard/settings/contact-form";
import { UsersTab } from "@/components/dashboard/settings/users-tab";
import { SubscriptionTab } from "@/components/dashboard/settings/subscription-tab";
import { LocationPicker } from "@/components/dashboard/settings/location-picker";
import { ExchangeRateCard } from "@/components/dashboard/settings/exchange-rate-card";
import { SettingsShell } from "@/components/dashboard/settings/settings-shell";
import { getCurrentUsdRate } from "@/lib/exchange-rate";
import { resolveSettingsSection } from "@/lib/settings-sections";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { clerkClient } from "@clerk/nextjs/server";

interface ConfiguracionPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ConfiguracionPage({ searchParams }: ConfiguracionPageProps) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  // El `tab` viene del query string: nunca se usa crudo, se matchea contra la
  // whitelist de secciones y cae al default si no existe.
  const initialSection = resolveSettingsSection((await searchParams).tab);

  // Obtener usuarios e invitaciones
  const [dealershipUsers, invites] = await Promise.all([
    prisma.dealershipUser.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dealershipInvite.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const limits = getPlanLimits(dealership);

  // Cotización oficial vigente (tabla → fallback BCRA en vivo) para la card.
  const usdRate = await getCurrentUsdRate();

  // Obtener los emails de Clerk para mostrarlos
  const clerkUserIds = dealershipUsers.map(u => u.clerkUserId);
  const clerkClientInstance = await clerkClient();
  const clerkUsers = await clerkClientInstance.users.getUserList({ userId: clerkUserIds });

  const usersWithEmail = dealershipUsers.map(du => {
    const clerkUser = clerkUsers.data.find(cu => cu.id === du.clerkUserId);
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
    return { id: du.id, email, role: du.role };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administrá tu concesionario, accesos y facturación.</p>
      </div>

      <SettingsShell
        initialSection={initialSection}
        panels={{
          // Quién sos y dónde estás: el mapa es la continuación de la dirección,
          // por eso van en la misma sección.
          general: (
            <>
              <ContactForm dealership={dealership} />
              <LocationPicker
                latitude={dealership.latitude}
                longitude={dealership.longitude}
              />
            </>
          ),
          cotizacion: (
            <ExchangeRateCard
              usdSpread={Number(dealership.usdSpread)}
              officialRate={usdRate?.rate ?? null}
              rateDate={usdRate?.date ?? null}
              isAdmin={dealership.currentUser.role === "admin"}
            />
          ),
          usuarios: (
            <UsersTab
              users={usersWithEmail}
              invites={invites.map(i => ({ id: i.id, role: i.role, token: i.token, createdAt: i.createdAt }))}
              limits={limits}
              showCostsToNonAdmins={dealership.showCostsToNonAdmins}
              isAdmin={dealership.currentUser.role === "admin"}
            />
          ),
          suscripcion: <SubscriptionTab dealership={dealership} />,
        }}
      />
    </div>
  );
}
