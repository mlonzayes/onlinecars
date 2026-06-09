import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PiSignIn, PiSquaresFour, PiEnvelope } from "react-icons/pi";
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
    // Navbar sólido (sin backdrop-blur translúcido) — el grisado del bg-white/80
    // se veía sucio sobre los gradients y glows de la landing.
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
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

        <div className="hidden md:flex items-center gap-3">
          {/* Contacto — siempre visible (desktop + mobile). Scroll al Contacto. */}
          <a
            href="#contacto"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
          >
            <PiEnvelope className="size-3.5" />
            <span>Contacto</span>
          </a>

          {isLoginEnabled && (
            isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <PiSquaresFour className="size-3.5" />
                <span>Ir al panel</span>
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <PiSignIn className="size-3.5" />
                <span>Iniciar sesión</span>
              </Link>
            )
          )}
        </div>
        
        <MobileMenu isLoginEnabled={isLoginEnabled} isSignedIn={isSignedIn} />
      </nav>
    </header>
  );
}
