import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export default function OnboardingPage() {
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
