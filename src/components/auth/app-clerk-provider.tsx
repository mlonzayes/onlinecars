import { ClerkProvider } from "@clerk/nextjs";

/**
 * ClerkProvider de las superficies con sesión (marketing, panel, admin, auth).
 *
 * NO va en el root layout a propósito: el root envuelve también los sitios
 * públicos de los concesionarios, y ahí Clerk no se usa pero igual descarga
 * ~350 KB de JS + 2 fetches a la API de Clerk en cada visita. Era el mayor
 * costo de main thread del sitio del tenant en Lighthouse.
 *
 * Ruta nueva que use componentes/hooks de Clerk en el cliente → envolverla con
 * esto en su layout. El `auth()` del server NO lo necesita (lo resuelve el
 * middleware).
 */
export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider afterSignOutUrl="/">{children}</ClerkProvider>;
}
