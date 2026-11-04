"use client";

import Link from "next/link";
import { useSessionHint } from "@/hooks/use-session-hint";

interface NavbarAuthLinkProps {
  primaryClassName: string;
}

/**
 * Acciones de sesión del navbar desktop. Client Component para que el navbar
 * no llame a `auth()` (eso volvía dinámica toda la web de marketing).
 * Con self-serve abierto, la primaria es el registro (misma acción que el hero);
 * "Ingresar" queda como link para quien ya tiene cuenta.
 */
export function NavbarAuthLink({ primaryClassName }: NavbarAuthLinkProps) {
  const isSignedIn = useSessionHint();

  if (isSignedIn) {
    return (
      <Link href="/dashboard" prefetch={false} className={primaryClassName}>
        Ir al panel
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/sign-in"
        prefetch={false}
        className="text-sm font-light text-ink-soft transition hover:text-ink"
      >
        Ingresar
      </Link>
      <Link href="/sign-up" prefetch={false} className={primaryClassName}>
        Probar gratis
      </Link>
    </>
  );
}
