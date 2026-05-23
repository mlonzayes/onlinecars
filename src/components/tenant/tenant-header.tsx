"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

interface TenantHeaderProps {
  // Solo los campos del dealer que el header necesita — evitamos pasar
  // el objeto Prisma completo (Date fields rompen el boundary server→client en Next 15).
  name: string;
  logo: string | null;
  basePath: string;
}

function buildNavItems(basePath: string): NavItem[] {
  return [
    { label: "Inicio", href: basePath },
    { label: "Catálogo", href: `${basePath}/catalogo` },
    { label: "Vender", href: `${basePath}/cotizar` },
    { label: "Opiniones", href: `${basePath}#opiniones` },
  ];
}

export function TenantHeader({ name, logo, basePath }: TenantHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = buildNavItems(basePath);

  // Cerrar el menu mobile al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el menu mobile está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  // El CTA del header siempre es "Contacto" → ancla #contacto en la home.
  // El acceso por WhatsApp lo cubre el FAB flotante (whatsapp-fab.tsx) para evitar duplicación.
  const contactHref = `${basePath}#contacto`;

  function isActive(href: string): boolean {
    // Para anchors (#opiniones, #contacto) nunca marcamos como active.
    if (href.includes("#")) return false;
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={basePath}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={name}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--tenant-primary)] text-white shadow-sm">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {name}
              </span>
            </>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-[var(--tenant-primary)]",
                isActive(item.href) && "text-[var(--tenant-primary)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={contactHref}
            className="inline-flex items-center rounded-full bg-[var(--tenant-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Contacto
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100",
                  isActive(item.href) && "bg-slate-100 text-[var(--tenant-primary)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3">
              <Link
                href={contactHref}
                className="flex w-full items-center justify-center rounded-lg bg-[var(--tenant-primary)] px-4 py-3 text-base font-semibold text-white shadow-sm"
              >
                Contacto
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
