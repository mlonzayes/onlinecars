import { CustomerForm } from "@/components/dashboard/customer-form";

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Agregar cliente</h1>
      <CustomerForm />
    </div>
  );
}
