import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { LogIn, LayoutDashboard } from "lucide-react";

export async function Navbar() {
  const isLoginEnabled =
    process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  let isSignedIn = false;

  if (isLoginEnabled) {
    const { userId } = await auth();
    isSignedIn = !!userId;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Online<span className="text-blue-600">Cars</span>
          </span>
        </Link>

        {isLoginEnabled && (
          <div>
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-px"
              >
                <LayoutDashboard className="size-4" />
                Ir al panel
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-px"
              >
                <LogIn className="size-4" />
                Iniciar sesión
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
