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
        // Tras completar el registro (incluida la verificación de email),
        // mandamos SIEMPRE al onboarding. Sin esto Clerk caía al default "/"
        // o re-renderizaba el form de sign-up (el "rebote" que veías con el link).
        forceRedirectUrl="/onboarding"
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
