"use client";

import { useEffect, useState } from "react";

/**
 * Pista de sesión SIN cargar Clerk: lee la cookie `__client_uat` que Clerk
 * escribe en el dominio raíz (no es httpOnly). Vale "0" o no existe si no hay
 * sesión; un timestamp > 0 si la hay. En instancias nuevas el nombre viene con
 * sufijo (`__client_uat_<hash>`), por eso se matchea por prefijo.
 *
 * Existe para que la web de marketing sea ESTÁTICA: `auth()` en el server la
 * volvía dinámica (sin cache de CDN) y el ClerkProvider bajaba ~350 KB de JS
 * solo para elegir entre "Registrarse" e "Ir al panel".
 *
 * Es solo una pista para un link: si miente, /dashboard y /sign-up ya redirigen
 * al lugar correcto. NUNCA usarla para decidir acceso a nada.
 *
 * Arranca en false (igual que el HTML del server) y se actualiza al montar,
 * así no hay hydration mismatch.
 */
export function useSessionHint(): boolean {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const signedIn = document.cookie.split("; ").some((pair) => {
      const [name, value] = pair.split("=");
      return name.startsWith("__client_uat") && Number(value) > 0;
    });
    setIsSignedIn(signedIn);
  }, []);

  return isSignedIn;
}
