import { WhatsAppIcon } from "@/components/tenant/social-icons";
import { SITE_WHATSAPP_URL } from "@/lib/seo";

// FAB de WhatsApp de la web principal (ventas/soporte). Número fijo desde seo.ts.
// No lleva "use client": es un <a> estático, no necesita interactividad.
export function WhatsAppFab() {
  return (
    <a
      href={SITE_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-100"
      aria-label="Contactar por WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />

      {/* Pulse animation */}
      <span
        className="absolute -inset-1 animate-ping rounded-full bg-[#25D366]/30"
        style={{ animationDuration: "2s" }}
      />
    </a>
  );
}
