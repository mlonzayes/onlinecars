import { AppClerkProvider } from "@/components/auth/app-clerk-provider";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
