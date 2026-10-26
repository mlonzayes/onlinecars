"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { PiList, PiX } from "react-icons/pi";
import { WhatsAppIcon } from "@/components/tenant/social-icons";
import { SITE_WHATSAPP_URL } from "@/lib/seo";
import { MARKETING_NAV_LINKS } from "./marketing-nav-links";

interface MobileMenuProps {
  isLoginEnabled: boolean;
  isSignedIn: boolean;
}

export function MobileMenu({ isLoginEnabled, isSignedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const primary = !isLoginEnabled
    ? { href: "/#contacto", label: "Contacto" }
    : isSignedIn
      ? { href: "/dashboard", label: "Ir al panel" }
      : { href: "/sign-up", label: "Probar 15 días gratis" };
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  // El portal necesita document.body — solo disponible en cliente.
  useEffect(() => setMounted(true), []);

  // Al abrir: lock del scroll del body + animación de entrada (overlay + stagger).
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    let ctx: gsap.Context | undefined;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ctx = gsap.context(() => {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: "power2.out" }
        );
        if (itemsRef.current) {
          gsap.fromTo(
            Array.from(itemsRef.current.children),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.08, ease: "power3.out" }
          );
        }
      });
    }

    return () => {
      document.body.style.overflow = "";
      ctx?.revert();
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
          <div ref={overlayRef} className="fixed inset-0 z-[100] flex flex-col bg-paper">
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
            <div ref={itemsRef} className="flex flex-1 flex-col px-6 pt-4">
              {MARKETING_NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className="border-b border-ink/10 py-5 font-display text-2xl font-light text-ink transition hover:text-brand"
                >
                  {l.label}
                </Link>
              ))}

              <div className="mt-8 flex flex-col gap-3">
                {/* Primaria: la misma acción que el hero (registro con self-serve
                    abierto). WhatsApp queda como secundaria. */}
                <Link
                  href={primary.href}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3.5 text-sm font-medium text-white transition hover:bg-brand-deep"
                >
                  {primary.label}
                </Link>
                {isLoginEnabled && !isSignedIn && (
                  <Link
                    href="/sign-in"
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
