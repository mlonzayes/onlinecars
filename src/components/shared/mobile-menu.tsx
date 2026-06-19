"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { PiList, PiX, PiEnvelope, PiGauge, PiUserPlus } from "react-icons/pi";

interface MobileMenuProps {
  isLoginEnabled: boolean;
  isSignedIn: boolean;
}

const LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

export function MobileMenu({ isLoginEnabled, isSignedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="md:hidden">
      <button
        type="button"
        className="rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
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
          <div ref={overlayRef} className="fixed inset-0 z-[100] flex flex-col bg-white">
            {/* Header del menú: marca + cerrar */}
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <Image src="/logo/motorflow_light.png" alt="motorflow" width={150} height={150} />
              <button
                type="button"
                className="rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar menú"
              >
                <PiX className="size-6" />
              </button>
            </div>

            {/* Links + acciones */}
            <div ref={itemsRef} className="flex flex-1 flex-col px-6 pt-4">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className="border-b border-gray-100 py-5 text-2xl font-light text-gray-900 transition hover:text-blue-600"
                >
                  {l.label}
                </Link>
              ))}

              <div className="mt-8 flex flex-col gap-3">
                {/* Login — secundario (outline) */}
                {isLoginEnabled &&
                  (isSignedIn ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3.5 text-sm font-medium text-gray-900 transition hover:border-gray-900"
                    >
                      <PiGauge className="size-4" />
                      <span>Ir al panel</span>
                    </Link>
                  ) : (
                    <Link
                      href="/sign-up"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3.5 text-sm font-medium text-gray-900 transition hover:border-gray-900"
                    >
                      <PiUserPlus className="size-4" />
                      <span>Registrarse</span>
                    </Link>
                  ))}

                {/* Contacto — primario (azul sólido) */}
                <a
                  href="#contacto"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <PiEnvelope className="size-4" />
                  <span>Contacto</span>
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
