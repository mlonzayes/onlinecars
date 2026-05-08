import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { LogIn, LayoutDashboard, Mail } from "lucide-react";

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
            motor<span className="text-blue-600">flow</span>
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
          <a
            href="#planes"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Planes
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-2">
          {/* Contacto — siempre visible (desktop + mobile). Scroll al pre-registro. */}
          <a
            href="#pre-registro"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
          >
            <Mail className="size-3.5" />
            <span className="hidden sm:inline">Contacto</span>
          </a>

          {isLoginEnabled && (
            isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <LayoutDashboard className="size-3.5" />
                <span className="hidden sm:inline">Ir al panel</span>
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <LogIn className="size-3.5" />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
