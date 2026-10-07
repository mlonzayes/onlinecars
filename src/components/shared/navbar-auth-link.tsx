"use client";

import Link from "next/link";
import { PiUserPlus, PiGauge } from "react-icons/pi";
import { useSessionHint } from "@/hooks/use-session-hint";

const LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900";

// prefetch={false}: prefetchear /sign-up o /dashboard baja los chunks de Clerk
// en la landing, que es justo lo que se sacó de acá.
/** Login del navbar desktop — acción SECUNDARIA: ghost neutro para no competir con la primaria. */
export function NavbarAuthLink() {
  const isSignedIn = useSessionHint();

  return isSignedIn ? (
    <Link href="/dashboard" prefetch={false} className={LINK_CLASS}>
      <PiGauge className="size-3.5" />
      <span>Ir al panel</span>
    </Link>
  ) : (
    <Link href="/sign-up" prefetch={false} className={LINK_CLASS}>
      <PiUserPlus className="size-3.5" />
      <span>Registrarse</span>
    </Link>
  );
}
