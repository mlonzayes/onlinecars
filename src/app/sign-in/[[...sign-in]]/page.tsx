import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignInPage() {
  const isLoginEnabled =
    process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  if (!isLoginEnabled) redirect("/");

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
