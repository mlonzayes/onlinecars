import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignInPage() {
  const isLoginEnabled =
    process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  if (!isLoginEnabled) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <SignIn />
    </div>
  );
}
