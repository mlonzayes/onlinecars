import { VehicleForm } from "@/components/dashboard/vehicle-form";

export default function NuevoVehiculoPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Agregar vehículo</h1>
      <VehicleForm />
    </div>
  );
}
