import { getCurrentDealership } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/dashboard/settings/contact-form";
import { UsersTab } from "@/components/dashboard/settings/users-tab";
import { SubscriptionTab } from "@/components/dashboard/settings/subscription-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { clerkClient } from "@clerk/nextjs/server";
export default async function ConfiguracionPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

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

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios y Accesos</TabsTrigger>
          <TabsTrigger value="suscripcion">Suscripción</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-0 space-y-6">
          <ContactForm dealership={dealership} />
        </TabsContent>
        
        <TabsContent value="usuarios" className="mt-0">
          <UsersTab 
            users={usersWithEmail} 
            invites={invites.map(i => ({ id: i.id, role: i.role, token: i.token, createdAt: i.createdAt }))} 
            limits={limits} 
          />
        </TabsContent>

        <TabsContent value="suscripcion" className="mt-0">
          <SubscriptionTab dealership={dealership} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
