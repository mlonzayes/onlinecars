import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import "./globals.css";

// Manrope: SaaS B2B premium, variable font (un único archivo cubre todos los pesos).
// Se inyecta como --font-sans (que globals.css ya mapea a font-sans de Tailwind).
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "motorflow — Tu concesionario online",
  description: "La plataforma SaaS para que tu concesionario venda más en internet.",
};

import { esES } from "@clerk/localizations";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" className={cn("font-sans", manrope.variable)} suppressHydrationWarning>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
