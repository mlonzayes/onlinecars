import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CustomerForm } from "@/components/dashboard/customer-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const customer = await prisma.customer.findFirst({
    where: { id, dealershipId: dealership.id },
  });

  if (!customer) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Editar cliente</h1>
      <CustomerForm customer={customer} />
    </div>
  );
}
