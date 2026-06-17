import { SOCIAL_NETWORKS, SOCIAL_NETWORK_META, type SocialNetwork } from "@/lib/constants";
import type { SocialLinks } from "@/types";

// Normaliza lo que el dealer carga en un input de red social a una URL absoluta.
// Acepta dos formatos:
//   - URL completa ("https://instagram.com/foo", "instagram.com/foo") → se respeta.
//   - Handle suelto ("foo", "@foo") → se le antepone el baseUrl de la red.
// Devuelve null para strings vacíos. No valida que el perfil exista, solo arma
// una URL bien formada y segura (solo http/https).
export function normalizeSocialUrl(network: SocialNetwork, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  // Ya parece una URL (con o sin protocolo).
  if (/^https?:\/\//i.test(value)) {
    return isSafeHttpUrl(value) ? value : null;
  }
  if (/^[a-z0-9-]+\.[a-z]{2,}\//i.test(value) || /^(www\.)/i.test(value)) {
    const withProto = `https://${value}`;
    return isSafeHttpUrl(withProto) ? withProto : null;
  }

  // Handle suelto: sacamos un "@" inicial y lo pegamos al baseUrl de la red.
  const handle = value.replace(/^@/, "");
  return `${SOCIAL_NETWORK_META[network].baseUrl}${handle}`;
}

// Normaliza el objeto entero. Descarta keys vacías/inválidas — si queda vacío
// devuelve null (para guardar null en la columna en vez de un objeto vacío).
export function normalizeSocialLinks(input: Partial<Record<SocialNetwork, string>>): SocialLinks | null {
  const result: SocialLinks = {};
  for (const network of SOCIAL_NETWORKS) {
    const url = normalizeSocialUrl(network, input[network] ?? "");
    if (url) result[network] = url;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
