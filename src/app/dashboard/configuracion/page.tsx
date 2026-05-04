import { getCurrentDealership } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/dashboard/settings/contact-form";

export default async function ConfiguracionPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Datos de tu concesionario, contacto y ubicación.</p>
      </div>
      <ContactForm dealership={dealership} />
    </div>
  );
}
