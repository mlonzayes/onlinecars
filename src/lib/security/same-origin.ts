// Defensa CSRF para endpoints que mutan con la cookie de sesión de Clerk.
//
// Los sitios de los tenants ({slug}.motorflowapp.com) son SAME-SITE con el
// panel (app.motorflowapp.com): para el browser es el mismo sitio, así que
// SameSite=Lax no frena un POST que salga de ahí. El header Origin sí: todo
// browser moderno lo manda en un POST, y un tenant no lo puede falsificar.

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** true si el POST viene del mismo origen que el endpoint (o de NEXT_PUBLIC_APP_URL). */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Sin Origin no es un POST de un browser moderno: no hay forma de validarlo.
  if (!origin) return false;
  const allowed = [originOf(request.url), originOf(process.env.NEXT_PUBLIC_APP_URL)];
  return allowed.includes(origin);
}
