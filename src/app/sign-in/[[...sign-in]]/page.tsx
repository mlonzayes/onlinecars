import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
}) {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  if (!isLoginEnabled) redirect("/");

  // Si ya hay sesión activa y estamos en la ruta base (NO en un sub-path del
  // callback OAuth como /sign-in/sso-callback), sacamos al usuario del login.
  // El dashboard layout se encarga de rutear a onboarding/aceptar-terminos/etc.
  // Esto corta el ping-pong login↔signup cuando el OAuth ya creó la sesión.
  const { userId } = await auth();
  const segments = (await params)["sign-in"];
  if (userId && !segments) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 shadow-sm transition-all",
            card: "shadow-2xl border border-gray-200 rounded-2xl",
          }
        }}
      />
    </div>
  );
}
