import { redirect } from "next/navigation";
import { VehicleForm } from "@/components/dashboard/vehicle-form";
import { getCurrentDealership } from "@/lib/auth";
import { canEditCosts } from "@/lib/permissions";

export default async function NuevoVehiculoPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Agregar vehículo</h1>
      <VehicleForm canEditCosts={canEditCosts(dealership.currentUser)} />
    </div>
  );
}
