import { redirect } from "next/navigation";
import { getCurrentDealership } from "@/lib/auth";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export default async function OnboardingPage() {
  // Si el usuario YA tiene concesionario, no tiene sentido mostrarle el onboarding
  // de nuevo: lo mandamos al dashboard, que a su vez rutea a aceptar-terminos o
  // pago si corresponde. Esto implementa el "si ya está onboarded, va derecho al
  // dashboard" y evita que el que intenta re-registrarse quede en el form vacío.
  // Va en la PAGE (no en el layout) a propósito: /aceptar-terminos comparte el
  // route group (onboarding) y rebotarlo desde el layout crearía otro loop.
  const dealership = await getCurrentDealership();
  if (dealership) redirect("/dashboard");

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Configurá tu concesionario</h1>
        <p className="text-muted-foreground mt-2">
          Completá estos datos para activar tu panel de administración.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
