"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/marketing/attribution";

/**
 * Guarda los UTMs / click ids de la URL para mandarlos con el form de contacto.
 * Se monta UNA vez en `(marketing)/layout.tsx`. Corre en cada navegación porque
 * un visitante puede volver a entrar desde otro anuncio sin recargar.
 */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttribution();
  }, [pathname, searchParams]);

  return null;
}
