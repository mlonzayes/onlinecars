import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentDealership } from "@/lib/auth";
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

  return (
    <SidebarProvider>
      <DashboardSidebar dealership={dealership} />
      <main className="flex flex-1 flex-col">
        <DashboardHeader dealershipName={dealership.name} />
        <div className="flex-1 p-6">{children}</div>
        <DashboardFooter />
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
