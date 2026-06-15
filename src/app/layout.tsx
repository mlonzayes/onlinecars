import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import "./globals.css";

// DM Sans: geométrica humanista, pesos 300-700. Base weight 300 (light) da el
// aspecto "fino" sin perder legibilidad. Reemplaza Manrope que es demasiado genérica.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "motorflow — Tu concesionario online",
  description: "La plataforma SaaS para que tu concesionario venda más en internet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="es" className={cn("font-sans font-light", dmSans.variable)} suppressHydrationWarning>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
