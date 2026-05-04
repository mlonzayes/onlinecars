import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { Badge } from "@/components/ui/badge";

export default async function LeadsPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const leads = await prisma.lead.findMany({
    where: { dealershipId: dealership.id },
    include: {
      vehicle: { select: { id: true, title: true, brand: true, model: true, year: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = leads.filter((l) => l.status === "new").length;

  // Serializar fechas para el Client Component
  const serialized = leads.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Leads</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} sin leer</Badge>
        )}
      </div>
      <LeadsTable leads={serialized} />
    </div>
  );
}
