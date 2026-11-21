import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { MARKETING_NAV_LINKS } from "./marketing-nav-links";
import { NavbarAuthLink } from "./navbar-auth-link";

// Mismo azul profundo del escenario del hero, para que la barra y el hero se
// lean como una sola pieza.
const PRIMARY =
  "nav-cta inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-white transition hover:brightness-125";

/**
 * Barra fija de la web de marketing. Arriba de todo es invisible (solo logo y
 * links sobre el fondo); al scrollear se "arma" la cápsula de vidrio, con la
 * misma estética que las tarjetas `.glass-card`.
 *
 * La cápsula es una capa aparte (`.nav-shell`) que anima solo opacity y
 * transform con CSS scroll-driven: sin JS ni scroll listeners, y el contenido
 * no se mueve (cero layout shift). Sin soporte de scroll-timeline o con
 * reduced-motion, la cápsula queda siempre visible.
 * El header mide h-16 en total (pt-2 + cápsula h-14): el hero del home cuenta
 * con ese alto para entrar en una pantalla.
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
    <header className="sticky top-0 z-50 w-full px-2 pt-2 sm:px-3">
      <nav className="relative isolate mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 pl-5 pr-2 sm:pl-6">
        <span aria-hidden className="nav-shell glass-nav absolute inset-0 -z-10 rounded-full" />
        <Link href="/" className="flex shrink-0 items-center" aria-label="motorflow, inicio">
          <Image
            src="/logo/motorflow_light.png"
            alt="motorflow"
            width={132}
            height={132}
            className="h-auto w-[120px] sm:w-[132px]"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {MARKETING_NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-light text-ink-soft transition hover:bg-ink/5 hover:text-ink"
            >
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
