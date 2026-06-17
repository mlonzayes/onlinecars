"use client";

import { WhatsAppIcon } from "./social-icons";

interface WhatsAppFabProps {
  whatsapp: string;
  // Mensaje pre-cargado al abrir el chat. Null/undefined = usar default.
  message?: string | null;
}

const DEFAULT_MESSAGE = "Hola! Vi su sitio web y me gustaría consultar.";

export function WhatsAppFab({ whatsapp, message }: WhatsAppFabProps) {
  const cleaned = whatsapp.replace(/\D/g, "");
  const text = message?.trim() || DEFAULT_MESSAGE;
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-100"
      aria-label="Contactar por WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />

      {/* Pulse animation */}
      <span className="absolute -inset-1 animate-ping rounded-full bg-[#25D366]/30" style={{ animationDuration: "2s" }} />
    </a>
  );
}
