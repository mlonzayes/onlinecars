/**
 * Tipos y helpers de normalización compartidos por el importador.
 *
 * Separado de la definición de columnas para que ese archivo quede como lo que
 * es: una tabla de datos declarativa, sin lógica mezclada.
 */

// Techo de filas por importación. Vercel corta las funciones serverless por
// timeout, así que preferimos que el dealer parta un Excel gigante en dos
// antes que comerse un 504 a mitad del insert.
export const MAX_IMPORT_ROWS = 300;

// Tamaño de los chunks de inserción. Si un chunk falla, se reintenta fila por
// fila para aislar a la culpable (ver el servicio de import).
export const IMPORT_CHUNK_SIZE = 25;

export type ImportFieldType = "text" | "integer" | "decimal" | "enum" | "boolean";

export interface ImportColumn {
  key: string;
  /** Header exacto que lleva la plantilla generada. */
  header: string;
  type: ImportFieldType;
  required?: boolean;
  /** Valor de ejemplo de la fila modelo de la plantilla. */
  example: string;
  /** Valor normalizado -> valor interno. Solo para type "enum". */
  options?: Record<string, string>;
  /** Ayuda mostrada en la hoja de instrucciones de la plantilla. */
  hint?: string;
  maxLength?: number;
  min?: number;
  max?: number;
}

/**
 * Normaliza un string para comparar sin depender de acentos, mayúsculas ni
 * espacios. "Kilómetros" y "kilometros" tienen que matchear igual — el dealer
 * va a editar la plantilla a mano y no podemos exigirle precisión de tipeo.
 */
export function normalizeKey(raw: string): string {
  // NFD separa cada acento en un carácter combinante propio; el filtro final
  // se lleva puestos tanto esos combinantes como espacios y puntuación.
  return raw.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Construye el mapa de opciones aceptadas para un enum a partir de sus labels.
 * Aceptamos tanto el valor interno ("nafta") como la label de UI ("Nafta"),
 * porque la plantilla muestra labels pero un export de otro sistema puede
 * traer los valores crudos.
 */
export function buildOptions(labels: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [value, label] of Object.entries(labels)) {
    out[normalizeKey(value)] = value;
    out[normalizeKey(label)] = value;
  }
  return out;
}

export function labelList(labels: Record<string, string>): string {
  return Object.values(labels).join(" · ");
}

// Truthy tolerante: el dealer puede escribir "Sí", "X", "1" o "TRUE".
const BOOLEAN_TRUE = new Set(["si", "s", "true", "verdadero", "x", "1", "yes"]);
const BOOLEAN_FALSE = new Set(["no", "n", "false", "falso", "0", ""]);

export function parseBooleanCell(raw: string): boolean | null {
  const key = normalizeKey(raw);
  if (BOOLEAN_TRUE.has(key)) return true;
  if (BOOLEAN_FALSE.has(key)) return false;
  return null;
}
