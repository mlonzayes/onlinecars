import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VehicleForm } from "@/components/dashboard/vehicle-form";
import { findBlockingSale } from "@/lib/sale-guards";

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealership.id },
    include: { images: true },
  });

  if (!vehicle) notFound();

  // Si hay una venta activa (reserved/in_progress/completed), el vehículo se
  // muestra en modo lectura. La validación dura igual está en el backend.
  const blockingSale = await findBlockingSale(id, dealership.id);

  // Serializar Decimal antes de pasar al Client Component (Next 15 no acepta
  // objetos no-plain). Las imágenes ya son plain (solo strings/numbers/booleans).
  const serializedVehicle = {
    ...vehicle,
    price: vehicle.price.toString(),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Editar vehículo</h1>
      <VehicleForm vehicle={serializedVehicle} blockingSale={blockingSale} />
    </div>
  );
}
