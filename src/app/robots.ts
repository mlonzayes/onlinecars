import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// robots.txt del dominio principal. Permite indexar el marketing, bloquea las
// rutas privadas/funcionales, y apunta al sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/api",
          "/sign-in",
          "/sign-up",
          "/onboarding",
          "/aceptar-terminos",
          "/vista-previa",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
