import { formatVehiclePrice } from "@/lib/tenant-format";
import { CHAT_COPY } from "./copy";

// Cambios que una prompt injection buscaría y que un click automático en
// "Confirmar" dejaría pasar: un precio regalado o datos de contacto/links
// ajenos en un texto que se publica. La tarjeta los resalta y pide un segundo
// paso. No bloquea: el dealer puede querer bajar un precio de verdad.

// Baja de precio (misma moneda) a partir de la cual se avisa.
export const PRICE_DROP_WARNING_RATIO = 0.3;

// Campos de texto que terminan en el sitio público.
const PUBLIC_TEXT_FIELDS = ["title", "description", "brand", "model", "color", "engine"] as const;

// Teléfono: 8+ dígitos con espacios, guiones o paréntesis. El punto queda
// afuera a propósito: "25.000.000" es un precio, no un teléfono.
const PHONE = /\+?\d[\d\s()-]{6,}\d/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const LINK =
  /\b(?:https?:\/\/|www\.)\S+|\bwa\.me\/\S*|\b[\w-]+\.(?:com|net|org|io|me|ly|link|app|ar|info|biz|xyz|site|online|store)(?:\.ar)?(?:\/\S*)?/gi;

const digits = (value: string) => value.replace(/\D/g, "");

/** Teléfonos, mails y links de un texto, normalizados para comparar. */
function findContacts(text: string): Map<string, string> {
  const found = new Map<string, string>();
  // Un mail también matchea como dominio: se descarta como link.
  const links = (text.match(LINK) ?? []).filter((match) => !text.includes(`@${match}`));
  for (const match of links) found.set(`link:${match.toLowerCase()}`, match);
  for (const match of text.match(EMAIL) ?? []) found.set(`mail:${match.toLowerCase()}`, match);
  for (const match of text.match(PHONE) ?? []) {
    // El número de un wa.me/... ya aparece en el link.
    if (digits(match).length < 8 || links.some((link) => link.includes(match.trim()))) continue;
    found.set(`tel:${digits(match)}`, match.trim());
  }
  return found;
}

/** Contactos/links que el texto nuevo AGREGA (los que ya estaban no se avisan). */
export function addedContacts(before: string, after: string): string[] {
  const previous = findContacts(before);
  return [...findContacts(after)].filter(([key]) => !previous.has(key)).map(([, raw]) => raw);
}

const str = (value: unknown) => (value === undefined || value === null ? "" : String(value));

function priceWarnings(current: Record<string, unknown>, changes: Record<string, unknown>): string[] {
  const currentCurrency = str(current.currency);
  const nextCurrency = changes.currency === undefined ? currentCurrency : str(changes.currency);
  if (nextCurrency !== currentCurrency) {
    // Mismo número en otra moneda es un cambio de precio enorme (o un regalo).
    return [CHAT_COPY.warnings.currencyChange(currentCurrency, nextCurrency)];
  }
  if (changes.price === undefined) return [];

  const before = Number(current.price);
  const after = Number(changes.price);
  if (!(before > 0) || !Number.isFinite(after)) return [];
  const drop = 1 - after / before;
  if (drop < PRICE_DROP_WARNING_RATIO) return [];
  return [
    CHAT_COPY.warnings.priceDrop(
      Math.round(drop * 100),
      formatVehiclePrice(before, currentCurrency),
      formatVehiclePrice(after, currentCurrency)
    ),
  ];
}

function contactWarnings(current: Record<string, unknown>, changes: Record<string, unknown>): string[] {
  const added = PUBLIC_TEXT_FIELDS.flatMap((field) =>
    changes[field] === undefined ? [] : addedContacts(str(current[field]), str(changes[field]))
  );
  return added.length > 0 ? [CHAT_COPY.warnings.contacts([...new Set(added)].join(", "))] : [];
}

/** Avisos de un update de vehículo: precio, moneda y contactos/links nuevos en texto público. */
export function vehicleUpdateWarnings(current: Record<string, unknown>, changes: Record<string, unknown>): string[] {
  return [...priceWarnings(current, changes), ...contactWarnings(current, changes)];
}

/** Avisos de un alta: solo contactos/links (no hay precio anterior con qué comparar). */
export function vehicleCreateWarnings(args: Record<string, unknown>): string[] {
  return contactWarnings({}, args);
}
