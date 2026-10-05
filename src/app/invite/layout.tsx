import { AppClerkProvider } from "@/components/auth/app-clerk-provider";

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
