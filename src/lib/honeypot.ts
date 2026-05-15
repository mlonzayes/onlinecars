// Campo trampa que se renderiza invisible en los forms públicos. Los humanos
// no lo ven ni lo tabulan; los bots que auto-rellenan todos los inputs sí lo
// completan. Si llega con valor en el body de un POST público, descartamos
// silenciosamente con respuesta 201 fake — no devolvemos error, así no le
// enseñamos al bot que detectamos.
//
// El nombre del campo debe parecer legítimo para que los bots lo intenten:
// "website" es la convención clásica anti-spam.
export const HONEYPOT_FIELD = "website";

export function isHoneypotTriggered(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof value !== "string") return false;
  return value.trim().length > 0;
}

// Estilo inline para el input honeypot. Inline en lugar de Tailwind class porque
// queremos garantizar el escondido aunque alguien refactoree los estilos sin
// pensarlo. Las cuatro técnicas son redundantes a propósito (defense-in-depth):
// position absoluta off-screen + tamaño 1px + opacidad 0.
export const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "-9999px",
  top: "-9999px",
  width: "1px",
  height: "1px",
  opacity: 0,
  pointerEvents: "none",
};
