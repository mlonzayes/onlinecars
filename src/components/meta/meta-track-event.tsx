"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/meta/client";
import type { MetaEventName } from "@/lib/meta/events";
import type { MetaCustomData } from "@/lib/meta/types";

interface MetaTrackEventProps {
  eventName: MetaEventName;
  customData?: MetaCustomData;
}

/**
 * Dispara un evento de Meta al montar. Sirve para eventos de VISTA
 * (ViewContent, Search) que no dependen de que el usuario haga algo.
 *
 * Se monta desde Server Components: `<MetaTrackEvent eventName="ViewContent" />`.
 *
 * EL RETRY NO ES PARANOIA. El snippet del pixel se inyecta con
 * `strategy="afterInteractive"`, y no hay garantía de orden entre eso y el
 * efecto de este componente. Si `window.fbq` todavía no existe cuando corre el
 * efecto, el evento se pierde en silencio — el peor tipo de bug de tracking,
 * porque el sitio anda perfecto y los números están mal. Reintentamos hasta
 * que el stub aparezca.
 *
 * Una vez que `fbq` existe, llamarlo es seguro aunque `fbevents.js` no haya
 * terminado de bajar: el snippet crea una cola que se vacía al cargar.
 */
const RETRY_INTERVAL_MS = 150;
const MAX_ATTEMPTS = 20; // ~3s. Si en 3s no cargó, es un adblocker: lo cubre la CAPI.

export function MetaTrackEvent({ eventName, customData }: MetaTrackEventProps) {
  // React 18 en modo estricto corre los efectos dos veces en desarrollo. Sin
  // este guard, cada ViewContent se contaría doble en local.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const attempt = () => {
      if (fired.current) return;

      if (typeof window.fbq === "function") {
        fired.current = true;
        trackMetaEvent(eventName, customData);
        return;
      }

      if (++attempts < MAX_ATTEMPTS) {
        timer = setTimeout(attempt, RETRY_INTERVAL_MS);
      }
    };

    attempt();
    return () => clearTimeout(timer);
    // customData es un objeto literal: incluirlo en las deps re-dispararía el
    // efecto en cada render. El guard `fired` lo hace irrelevante igual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);

  return null;
}
