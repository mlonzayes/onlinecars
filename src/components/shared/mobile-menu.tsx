"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { PiList, PiX } from "react-icons/pi";
import { WhatsAppIcon } from "@/components/tenant/social-icons";
import { SITE_WHATSAPP_URL } from "@/lib/seo";
import { useSessionHint } from "@/hooks/use-session-hint";
import { MARKETING_NAV_LINKS } from "./marketing-nav-links";

interface MobileMenuProps {
  isLoginEnabled: boolean;
}

// Entrada en stagger de los items (antes GSAP: 0.4s, 0.06s entre items, 0.08s de arranque).
const ITEM_ENTER =
  "animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-400 ease-out motion-reduce:animate-none";

function itemDelay(index: number): React.CSSProperties {
  return { animationDelay: `${80 + index * 60}ms` };
}

export function MobileMenu({ isLoginEnabled }: MobileMenuProps) {
  const isSignedIn = useSessionHint();
  const [isOpen, setIsOpen] = useState(false);
  const primary = !isLoginEnabled
    ? { href: "/#contacto", label: "Contacto" }
    : isSignedIn
      ? { href: "/dashboard", label: "Ir al panel" }
      : { href: "/sign-up", label: "Probar 15 días gratis" };
  const [mounted, setMounted] = useState(false);

  // El portal necesita document.body — solo disponible en cliente.
  useEffect(() => setMounted(true), []);

  // Al abrir: lock del scroll del body. La animación de entrada es CSS
  // (tw-animate-css), sin GSAP en el bundle inicial de la landing.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="rounded-lg p-2 text-ink transition hover:bg-ink/5"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
      >
        <PiList className="size-6" />
      </button>

      {/* Portal a document.body: escapa del backdrop-blur del navbar, que rompía
          el position:fixed (lo confinaba al pill en vez del viewport). */}
      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-paper animate-in fade-in duration-250 motion-reduce:animate-none">
            {/* Header del menú: marca + cerrar */}
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <Image src="/logo/motorflow_light.png" alt="motorflow" width={150} height={150} />
              <button
                type="button"
                className="rounded-lg p-2 text-ink transition hover:bg-ink/5"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar menú"
              >
                <PiX className="size-6" />
              </button>
            </div>

            {/* Links + acciones */}
            <div className="flex flex-1 flex-col px-6 pt-4">
              {MARKETING_NAV_LINKS.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className={`border-b border-ink/10 py-5 font-display text-2xl font-light text-ink transition hover:text-brand ${ITEM_ENTER}`}
                  style={itemDelay(i)}
                >
                  {l.label}
                </Link>
              ))}

              <div
                className={`mt-8 flex flex-col gap-3 ${ITEM_ENTER}`}
                style={itemDelay(MARKETING_NAV_LINKS.length)}
              >
                {/* Primaria: la misma acción que el hero (registro con self-serve
                    abierto). WhatsApp queda como secundaria. */}
                <Link
                  href={primary.href}
                  prefetch={false}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3.5 text-sm font-medium text-white transition hover:bg-brand-deep"
                >
                  {primary.label}
                </Link>
                {isLoginEnabled && !isSignedIn && (
                  <Link
                    href="/sign-in"
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center rounded-lg border border-ink/15 px-6 py-3.5 text-sm font-medium text-ink transition hover:border-ink"
                  >
                    Ingresar
                  </Link>
                )}
                <a
                  href={SITE_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/15 px-6 py-3.5 text-sm font-medium text-ink transition hover:border-ink"
                >
                  <WhatsAppIcon className="size-4 text-[#25D366]" />
                  <span>Escribinos por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
