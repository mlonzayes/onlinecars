import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  // Mismo gate que el sign-in: si login está deshabilitado, no se puede registrar.
  if (!isLoginEnabled) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <SignUp
        signInUrl="/sign-in"
        // Tras el registro vamos al onboarding POR DEFECTO, pero respetando un
        // redirect_url si vino (ej: invitación a un dealership existente, que NO
        // debe crear una orga nueva). fallbackRedirectUrl = destino solo cuando no
        // hay redirect_url; NO usar forceRedirectUrl acá porque pisa la invitación.
        fallbackRedirectUrl="/onboarding"
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 shadow-sm transition-all",
            card: "shadow-2xl border border-gray-200 rounded-2xl",
          },
        }}
      />
    </div>
  );
}
