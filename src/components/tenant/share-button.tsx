"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  /** Título que se ofrece al compartir (ej: el título del vehículo). */
  title: string;
  /** Texto del botón en estado normal. */
  label?: string;
  className?: string;
}

/**
 * Botón de compartir con Web Share API nativa y fallback a copiar el enlace.
 *
 * Sin scripts de terceros a propósito: los widgets de share de las redes traen
 * su propio tracking, pesan más que toda la ficha y cargan desde un dominio que
 * no controlamos. `navigator.share` abre el menú nativo del sistema —en mobile,
 * que es donde se comparte un auto por WhatsApp— y no cuesta nada.
 *
 * El feedback es INLINE (el label cambia a "¡Copiado!") y no un toast: los
 * sitios de los tenants no montan `<Toaster />` en todos los caminos, y un
 * botón cuya única confirmación es un toast que no aparece deja al usuario
 * clickeando de nuevo sin entender qué pasó.
 */
export function ShareButton({ title, label = "Compartir", className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    // El share nativo se cancela con AbortError si el usuario cierra la hoja:
    // no es un fallo y no hay que mostrarle nada por eso.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Cualquier otro fallo cae al copiado de abajo.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard falla en contextos no seguros (http). Sin feedback falso:
      // preferimos que no pase nada a decirle que copió cuando no copió.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-live="polite"
      className={className}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          ¡Copiado!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
