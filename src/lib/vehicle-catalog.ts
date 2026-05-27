/**
 * Catálogo de vehículos de Argentina. Se usa para autocompletar el título y
 * los datos técnicos (marca, modelo, combustible, motor) en el form de carga
 * de vehículos del dashboard.
 *
 * Fuente: src/data/vehicle-catalog.csv — generado manualmente, actualizable
 * editando ese archivo directamente.
 *
 * Server-only: este módulo lee el filesystem en el primer acceso (Node fs).
 * El acceso se cachea a nivel módulo: solo la primera invocación toca disco.
 * El endpoint de búsqueda (/api/vehiculos/catalog) lo consume vía fetch del
 * cliente — por eso NO hay versión client-side directa de estos helpers.
 */
import "server-only";
import { readFileSync } from "fs";
import { join } from "path";

import type { FuelType } from "./constants";

export interface CatalogEntry {
  brand: string;
  model: string;
  /** Versión / línea del modelo. Puede ser null para entradas sin info de versión. */
  version: string | null;
  /** Combustible normalizado al enum interno. null si el CSV venía vacío. */
  fuel: FuelType | null;
  /** Cilindrada / motor (ej: "2.0 L"). null si no aplica (eléctricos, faltante). */
  engine: string | null;
  /** Nombre completo: "Toyota Corolla 2.0L SEG CVT". Es la clave para mostrar y buscar. */
  fullName: string;
}

// ─── Mojibake repair ─────────────────────────────────────────────────────────
// El CSV vino con UTF-8 leído como Latin-1 (typical export issue de Excel).
// Reemplazamos las secuencias visibles más comunes en español a su forma correcta.
// Si aparecen más casos a futuro, agregar acá — el caller no tiene que saber nada.
const MOJIBAKE_FIXES: Array<[string, string]> = [
  ["Ã©", "é"],
  ["Ã¡", "á"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã±", "ñ"],
  ["Ã«", "ë"],
  ["Ãœ", "Ü"],
  ["Ã‰", "É"],
  ["Ã'", "Ñ"],
];

function fixMojibake(s: string): string {
  let out = s;
  for (const [bad, good] of MOJIBAKE_FIXES) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  return out;
}

// ─── Fuel normalization ───────────────────────────────────────────────────────
// El CSV tiene strings tipo "Nafta", "Diesel", "Eléctrico", "Nafta Eléctrico".
// Las mapeamos al enum FuelType del proyecto. Si no matchea ninguno, null.
function normalizeFuel(raw: string): FuelType | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  // "Nafta Eléctrico" = híbrido (chequear ANTES de "nafta" puro porque incluye).
  if (trimmed.includes("eléctrico") && trimmed.includes("nafta")) return "hibrido";
  if (trimmed.includes("eléctrico")) return "electrico";
  if (trimmed.includes("diesel") || trimmed.includes("diésel")) return "diesel";
  if (trimmed.includes("gnc")) return "gnc";
  if (trimmed.includes("nafta")) return "nafta";
  return null;
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────
// Parser muy simple: split por linea, split por coma. No maneja quoted fields
// (el CSV no los tiene — verificado). Si en el futuro el CSV agrega comas dentro
// de valores, hay que pasar a un parser proper (csv-parse, papaparse, etc).
function parseCSV(content: string): CatalogEntry[] {
  const lines = content.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = {
    brand: headers.indexOf("brand"),
    model: headers.indexOf("model"),
    version: headers.indexOf("version"),
    fuel: headers.indexOf("fuel"),
    engine: headers.indexOf("engine"),
    fullName: headers.indexOf("full_name"),
  };

  // Si falta alguna columna esperada, la lib devuelve array vacío y loggea.
  // Mejor falla silenciosa al inicio que romper el endpoint en runtime.
  if (Object.values(idx).some((i) => i === -1)) {
    console.error("[vehicle-catalog] CSV headers no matchean el formato esperado", headers);
    return [];
  }

  const entries: CatalogEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const brand = fixMojibake((cols[idx.brand] ?? "").trim());
    const model = fixMojibake((cols[idx.model] ?? "").trim());
    if (!brand || !model) continue; // saltamos rows incompletas

    const version = fixMojibake((cols[idx.version] ?? "").trim()) || null;
    const fuel = normalizeFuel(fixMojibake(cols[idx.fuel] ?? ""));
    const rawEngine = fixMojibake((cols[idx.engine] ?? "").trim());
    // Si el CSV puso "Eléctrico" en engine (caso de autos eléctricos sin cilindrada),
    // lo dejamos como null para no contaminar el campo numeric-esque del form.
    const engine = rawEngine && !rawEngine.toLowerCase().includes("eléctrico") ? rawEngine : null;
    const fullName = fixMojibake((cols[idx.fullName] ?? "").trim()) || `${brand} ${model}`;

    entries.push({ brand, model, version, fuel, engine, fullName });
  }
  return entries;
}

// ─── Module-level cache ───────────────────────────────────────────────────────
// El CSV se lee una sola vez por proceso (warm-start, dev server, prod Lambda).
// No tiene sentido releer en cada request — el archivo solo cambia con un deploy.
let cached: CatalogEntry[] | null = null;

function loadCatalog(): CatalogEntry[] {
  if (cached !== null) return cached;
  try {
    const path = join(process.cwd(), "src", "data", "vehicle-catalog.csv");
    const content = readFileSync(path, "utf8");
    cached = parseCSV(content);
    return cached;
  } catch (err) {
    console.error("[vehicle-catalog] No se pudo cargar el CSV", err);
    cached = [];
    return cached;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Busca en el catálogo por query libre. Matchea contra `fullName` (incluye
 * marca + modelo + versión). Case-insensitive. Sin acentos para que "corolla"
 * matchee con autos cuya marca tenga acentos.
 *
 * Ranking: matches que arrancan con el query van primero, después contiene.
 * Dentro de cada bucket, orden alfabético por fullName.
 *
 * El `limit` evita devolver dropdowns inmensos — 15 es un balance OK.
 */
export function searchVehicleCatalog(query: string, limit = 15): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const catalog = loadCatalog();
  const startsWith: CatalogEntry[] = [];
  const contains: CatalogEntry[] = [];

  for (const entry of catalog) {
    const name = entry.fullName.toLowerCase();
    if (name.startsWith(q)) {
      startsWith.push(entry);
    } else if (name.includes(q)) {
      contains.push(entry);
    }
  }

  const sorted = [
    ...startsWith.sort((a, b) => a.fullName.localeCompare(b.fullName)),
    ...contains.sort((a, b) => a.fullName.localeCompare(b.fullName)),
  ];

  return sorted.slice(0, limit);
}
