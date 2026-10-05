import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppClerkProvider } from "@/components/auth/app-clerk-provider";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AppClerkProvider>
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        {children}
      </div>
    </AppClerkProvider>
  );
}
