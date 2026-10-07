import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { MARKETING_NAV_LINKS } from "./marketing-nav-links";
import { NavbarAuthLink } from "./navbar-auth-link";

const PRIMARY =
  "inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-deep";

/**
 * Barra fija de la web de marketing: fina, a todo el ancho y translúcida.
 * Mide h-16: el hero compensa con -mt-16 para quedar debajo de ella.
 * Los links se muestran desde lg; abajo de eso va el menú mobile (en tablet
 * no entraban los 5 links + 2 botones sin pisarse).
 *
 * Sin `auth()` a propósito: leer la sesión en el server vuelve dinámica TODA la
 * web de marketing (sin cache de CDN, TTFB alto). La sesión se detecta en el
 * cliente con `useSessionHint` (ver NavbarAuthLink).
 */
export function Navbar() {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ink/5 bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="motorflow, inicio">
          <Image
            src="/logo/motorflow_light.png"
            alt="motorflow"
            width={132}
            height={132}
            className="h-auto w-[120px] sm:w-[132px]"
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {MARKETING_NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-light text-ink-soft transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          {isLoginEnabled && <NavbarAuthLink primaryClassName={PRIMARY} />}
          {!isLoginEnabled && (
            <Link href="/#contacto" className={PRIMARY}>
              Contacto
            </Link>
          )}
        </div>

        <MobileMenu isLoginEnabled={isLoginEnabled} />
      </nav>
    </header>
  );
}
