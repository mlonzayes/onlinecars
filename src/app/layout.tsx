import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Tu concesionario online`,
    // Las sub-páginas (Precios, Blog, etc.) heredan el sufijo "| motorflow".
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "software para concesionarios",
    "sitio web para concesionaria de autos",
    "plataforma venta de autos",
    "catálogo de vehículos online",
    "gestión de stock de autos",
    "CRM concesionario",
    "publicar autos sin comisiones",
    "MercadoLibre autos integración",
    "software para concesionarias en español",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Tu concesionario online`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Tu concesionario online`,
    description: SITE_DESCRIPTION,
  },
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
