import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PiUserPlus, PiGauge, PiEnvelope } from "react-icons/pi";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";

export async function Navbar() {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  let isSignedIn = false;
  if (isLoginEnabled) {
    const { userId } = await auth();
    isSignedIn = !!userId;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent px-4 pt-3 pointer-events-none">
      <nav className="pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-gray-200/60 bg-white/80 py-2 pl-5 pr-3 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            {/* motor<span className="text-blue-600">flow</span> */}
            <Image src="/logo/motorflow_light.png" alt="Logo" width={150} height={150} />
          </span>
        </Link>

        {/* Links de navegación — solo desktop. En mobile el user scrollea. */}
        <div className="hidden items-center gap-7 md:flex">
          <a
            href="#servicios"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Servicios
          </a>
          <Link
            href="/precios"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Planes
          </Link>
          <a
            href="#faq"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            FAQ
          </a>
          <Link
            href="/blog"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Blog
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          {/* Login — acción SECUNDARIA: ghost neutro para no competir con la primaria. */}
          {isLoginEnabled && (
            isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <PiGauge className="size-3.5" />
                <span>Ir al panel</span>
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <PiUserPlus className="size-3.5" />
                <span>Registrarse</span>
              </Link>
            )
          )}

          {/* Contacto — acción PRIMARIA: el único botón sólido azul de la barra. */}
          <a
            href="#contacto"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PiEnvelope className="size-3.5" />
            <span>Contacto</span>
          </a>
        </div>
        
        <MobileMenu isLoginEnabled={isLoginEnabled} isSignedIn={isSignedIn} />
      </nav>
    </header>
  );
}
