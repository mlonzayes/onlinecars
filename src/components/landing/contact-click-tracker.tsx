"use client";

import { useEffect } from "react";
import {
  CONTACT_LOCATION_ATTR,
  getContactMethod,
  trackContactClick,
} from "@/lib/marketing/contact-click";

/**
 * Mide los clicks a WhatsApp / teléfono de TODA la web principal con un solo
 * listener delegado. Se monta UNA vez en `(marketing)/layout.tsx`.
 *
 * Detecta por el href, así un botón nuevo de WhatsApp se mide solo. El atributo
 * `data-contact-location` es opcional: sin él, el click cuenta como "otro".
 */
export function ContactClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link) return;
      const method = getContactMethod(link.getAttribute("href") ?? "");
      if (!method) return;
      trackContactClick(method, link.getAttribute(CONTACT_LOCATION_ATTR) ?? "otro");
    }

    // capture: corre aunque el link frene la propagación (ej. el menú mobile que se cierra).
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
