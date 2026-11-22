import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// robots.txt del dominio principal. Permite indexar el marketing, bloquea las
// rutas privadas/funcionales, y apunta al sitemap.
//
// Acá NO se bloquean los crawlers de entrenamiento de IA (AI_TRAINING_CRAWLERS):
// el blog y la landing son contenido nuestro y queremos que los modelos lo
// conozcan, porque es lo que les permite recomendar motorflow cuando alguien
// pregunta qué sistema usar. Los sitios de los concesionarios SÍ los bloquean
// (tenant/[slug]/robots.txt): ahí el contenido es del dealer, no nuestro.
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
          "/invite",
          "/cuenta-pausada",
          "/admin",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
