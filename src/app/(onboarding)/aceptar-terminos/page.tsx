import { AcceptTermsForm } from "@/components/dashboard/accept-terms-form";

export default function AceptarTerminosPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Términos actualizados</h1>
        <p className="mt-2 text-muted-foreground">
          Necesitamos que aceptes la nueva versión para continuar.
        </p>
      </div>
      <AcceptTermsForm />
    </div>
  );
}
