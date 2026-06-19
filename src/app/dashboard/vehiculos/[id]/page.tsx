import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VehicleForm } from "@/components/dashboard/vehicle-form";
import { findBlockingSale } from "@/lib/sale-guards";
import { MLVehiclePanel } from "@/components/dashboard/ml-vehicle-panel";
import { VehicleExpenses } from "@/components/dashboard/vehicle-expenses";
import { canSeeCosts, canEditCosts } from "@/lib/permissions";
import { getPlanLimits } from "@/lib/plans";
import { applySpread, getCurrentUsdRate } from "@/lib/exchange-rate";

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
  // costPrice se proyecta a null si el user no tiene permiso para verlo.
  const visibleCosts = canSeeCosts(dealership.currentUser, dealership);
  const serializedVehicle = {
    ...vehicle,
    price: vehicle.price.toString(),
    costPrice: visibleCosts && vehicle.costPrice ? vehicle.costPrice.toString() : null,
    costCurrency: visibleCosts ? vehicle.costCurrency : null,
  };

  // Gastos + cotización solo para quien puede ver costos (el panel los expone).
  const [expenses, usdBase] = visibleCosts
    ? await Promise.all([
        prisma.vehicleExpense.findMany({
          where: { vehicleId: id, dealershipId: dealership.id },
          orderBy: { date: "desc" },
        }),
        getCurrentUsdRate(),
      ])
    : [[], null];
  const usdRate = usdBase ? applySpread(usdBase, dealership.usdSpread).effective : null;
  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount.toString(),
    currency: e.currency,
    date: e.date.toISOString(),
  }));

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
      <VehicleForm
        vehicle={serializedVehicle}
        blockingSale={blockingSale}
        canEditCosts={canEditCosts(dealership.currentUser)}
        maxImagesPerVehicle={getPlanLimits(dealership).maxImagesPerVehicle}
      />
      {visibleCosts && (
        <VehicleExpenses
          vehicleId={id}
          expenses={serializedExpenses}
          canEdit={canEditCosts(dealership.currentUser)}
          price={Number(vehicle.price)}
          currency={vehicle.currency}
          costPrice={vehicle.costPrice ? Number(vehicle.costPrice) : null}
          costCurrency={vehicle.costCurrency}
          usdRate={usdRate}
        />
      )}
      <MLVehiclePanel
        vehicleId={id}
        initialListing={serializedListing as Parameters<typeof MLVehiclePanel>[0]["initialListing"]}
        hasMLAccount={!!mlAccount}
      />
    </div>
  );
}
