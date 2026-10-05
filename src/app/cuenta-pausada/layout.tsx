import { AppClerkProvider } from "@/components/auth/app-clerk-provider";

export default function PausedAccountLayout({ children }: { children: React.ReactNode }) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
