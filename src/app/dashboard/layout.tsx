import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentDealership } from "@/lib/auth";
import { hasAcceptedCurrentTerms } from "@/lib/legal";
import { applySpread, getCurrentUsdRate } from "@/lib/exchange-rate";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  // Safety net: si login está deshabilitado, no se puede acceder al dashboard
  if (!isLoginEnabled) redirect("/");

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  // Gate de T&C: si el usuario no aceptó la versión legal vigente (cuenta vieja
  // o documentos actualizados), lo mandamos a re-aceptar antes de entrar.
  if (!(await hasAcceptedCurrentTerms(userId))) redirect("/aceptar-terminos");

  // Gate de acceso: trial vencido o cuenta suspendida bloquean el dashboard.
  // El cron diario ya marca como "expired" los trials vencidos, pero hacemos
  // un check defensivo acá: si trialEndsAt pasó y todavía está como "trial"
  // (porque el cron no corrió aún), también lo tratamos como expirado.
  const now = Date.now();
  const trialExpiredButNotYetMarked =
    dealership.subscriptionStatus === "trial" &&
    dealership.trialEndsAt !== null &&
    dealership.trialEndsAt.getTime() < now;

  const isBlocked =
    dealership.subscriptionStatus === "expired" ||
    dealership.subscriptionStatus === "suspended" ||
    trialExpiredButNotYetMarked;

  if (isBlocked) {
    // Pasamos el motivo en query para que la pantalla muestre copy distinto.
    const reason =
      dealership.subscriptionStatus === "suspended" ? "suspended" : "expired";
    redirect(`/cuenta-pausada?reason=${reason}`);
  }

  // Cotización de trabajo del dealer (oficial BCRA + su spread) para el header.
  const baseRate = await getCurrentUsdRate();
  const usdRate = baseRate
    ? applySpread(baseRate, Number(dealership.usdSpread))
    : null;

  return (
    <SidebarProvider>
      <DashboardSidebar dealership={dealership} />
      <main className="flex flex-1 flex-col">
        <DashboardHeader dealershipName={dealership.name} usdRate={usdRate} />
        <div className="flex-1 p-6">{children}</div>
        <DashboardFooter />
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
