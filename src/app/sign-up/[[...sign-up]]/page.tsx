import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
}) {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  // Mismo gate que el sign-in: si login está deshabilitado, no se puede registrar.
  if (!isLoginEnabled) redirect("/");

  // Si ya hay sesión activa y estamos en la ruta base (NO en un sub-path del
  // callback OAuth como /sign-up/sso-callback), sacamos al usuario del registro.
  // Clave para cortar el loop: cuando alguien intenta "crear cuenta" con un
  // Google que YA existe, Clerk crea la sesión y transfiere a sign-in; sin este
  // guard quedaba rebotando entre /sign-up y /sign-in. Ahora, con sesión activa,
  // va derecho a /dashboard y el layout lo rutea según su estado (onboarding/T&C).
  const { userId } = await auth();
  const segments = (await params)["sign-up"];
  if (userId && !segments) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <SignUp
        signInUrl="/sign-in"
        // Destino unificado con el sign-in: SIEMPRE al dashboard, que es el único
        // router del estado de la cuenta (sin dealership → onboarding, sin T&C →
        // aceptar-terminos, etc.). fallbackRedirectUrl (no force) para no pisar el
        // redirect_url de una invitación a un dealership existente.
        fallbackRedirectUrl="/dashboard"
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
