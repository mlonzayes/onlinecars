"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/tenant/social-icons";
import { SITE_WHATSAPP_URL } from "@/lib/seo";

interface MobileStickyCtaProps {
  href: string;
  label: string;
}

/**
 * Barra fija abajo en mobile (la mayoría del tráfico de Meta). Aparece después
 * del hero para no duplicar el botón que ya está a la vista. Incluye el atajo
 * de WhatsApp: en mobile reemplaza al FAB, que se taparía con la barra.
 */
export function MobileStickyCta({ href, label }: MobileStickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-ink/10 bg-paper/95 p-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Link
        href={href}
        tabIndex={visible ? 0 : -1}
        className="flex flex-1 items-center justify-center rounded-lg bg-brand px-4 py-3 text-base font-medium text-white"
      >
        {label}
      </Link>
      <a
        href={SITE_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
        aria-label="Escribinos por WhatsApp"
        className="flex w-14 items-center justify-center rounded-lg bg-[#25D366] text-white"
      >
        <WhatsAppIcon className="size-6" />
      </a>
    </div>
  );
}
