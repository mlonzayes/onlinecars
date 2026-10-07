import Link from "next/link";
import { PiEnvelope } from "react-icons/pi";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { NavbarAuthLink } from "./navbar-auth-link";

// Sin `auth()` a propósito: leer la sesión en el server vuelve dinámica TODA la
// web de marketing (sin cache de CDN, TTFB alto). La sesión se detecta en el
// cliente con `useSessionHint` — ver ese hook.
export function Navbar() {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent px-4 pt-3 pointer-events-none">
      <nav className="pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-gray-200/60 bg-white/80 py-2 pl-5 pr-3 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            {/* motor<span className="text-blue-600">flow</span> */}
            <Image src="/logo/motorflow_light.png" alt="motorflow" width={150} height={150} />
          </span>
        </Link>

        {/* Links de navegación — solo desktop. En mobile el user scrollea. */}
        <div className="hidden items-center gap-7 md:flex">
          {/* Anclas con "/" adelante: el navbar se renderiza también en /precios
              y /blog, donde un href="#faq" pelado no lleva a ningún lado. */}
          <Link
            href="/#producto"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Producto
          </Link>
          <Link
            href="/precios"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Planes
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            FAQ
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Blog
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          {isLoginEnabled && <NavbarAuthLink />}

          {/* Contacto — acción PRIMARIA: el único botón sólido azul de la barra. */}
          <Link
            href="/#contacto"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PiEnvelope className="size-3.5" />
            <span>Contacto</span>
          </Link>
        </div>
        
        <MobileMenu isLoginEnabled={isLoginEnabled} />
      </nav>
    </header>
  );
}
