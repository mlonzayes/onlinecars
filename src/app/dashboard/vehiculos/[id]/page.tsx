import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VehicleForm } from "@/components/dashboard/vehicle-form";
import { findBlockingSale } from "@/lib/sale-guards";
import { MLVehiclePanel } from "@/components/dashboard/ml-vehicle-panel";

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

  const blockingSale = await findBlockingSale(id, dealership.id);

  // Datos de ML en paralelo
  const [mlListing, mlAccount] = await Promise.all([
    prisma.mercadoLibreListing.findUnique({ where: { vehicleId: id } }),
    prisma.mercadoLibreAccount.findUnique({
      where: { dealershipId: dealership.id },
      select: { id: true },
    }),
  ]);

  // Serializar Decimal antes de pasar al Client Component (Next 15 no acepta
  // objetos no-plain). Las imágenes ya son plain (solo strings/numbers/booleans).
  const serializedVehicle = {
    ...vehicle,
    price: vehicle.price.toString(),
  };

  // Serializar listing de ML (las fechas no son plain)
  const serializedListing = mlListing
    ? {
        ...mlListing,
        lastSyncedAt: mlListing.lastSyncedAt?.toISOString() ?? null,
        createdAt: undefined,
        updatedAt: undefined,
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Editar vehículo</h1>
      <VehicleForm vehicle={serializedVehicle} blockingSale={blockingSale} />
      <MLVehiclePanel
        vehicleId={id}
        initialListing={serializedListing as Parameters<typeof MLVehiclePanel>[0]["initialListing"]}
        hasMLAccount={!!mlAccount}
      />
    </div>
  );
}
