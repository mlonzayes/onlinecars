import {
  COLUMN_BY_NORMALIZED_HEADER,
  normalizeKey,
  parseBooleanCell,
  VEHICLE_IMPORT_COLUMNS,
  type ImportColumn,
} from "./vehicle-columns";

export interface RowIssue {
  column: string;
  message: string;
}

export interface ParsedRow {
  /** Número de fila tal como se ve en Excel (con el header en la 1). */
  rowNumber: number;
  data: Record<string, string | number | boolean>;
  errors: RowIssue[];
}

/**
 * Convierte a número una celda que puede venir en cualquier formato regional.
 *
 * Si Excel entregó un número real, se usa tal cual. Cuando viene como texto hay
 * que desambiguar: "25.000.000,50" (AR) y "25,000,000.50" (US) son el mismo
 * monto con separadores invertidos. La regla es que el ÚLTIMO separador que
 * aparece manda como decimal, salvo que lo sigan exactamente 3 dígitos, en cuyo
 * caso es separador de miles ("1.500" es mil quinientos, no uno coma cinco).
 *
 * Es una heurística, y por eso el preview muestra el valor ya interpretado:
 * el usuario confirma el número que realmente se va a guardar.
 */
export function parseNumericCell(raw: string | number): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  // Fuera símbolos de moneda, espacios y cualquier cosa que no sea dígito o separador.
  const cleaned = raw.trim().replace(/[^0-9.,-]/g, "");
  if (!cleaned) return null;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);

  let normalized: string;
  if (lastSep === -1) {
    normalized = cleaned;
  } else if (cleaned.length - lastSep - 1 === 3) {
    // Exactamente 3 dígitos detrás del último separador → es agrupador de miles
    // ("1.500", "25.000.000", "1,234,567"). Se van todos los separadores.
    normalized = cleaned.replace(/[.,]/g, "");
  } else {
    // El último separador es el decimal; los anteriores son de miles.
    const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    normalized = `${intPart}.${cleaned.slice(lastSep + 1)}`;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseCell(
  column: ImportColumn,
  raw: string | number | boolean
): { value?: string | number | boolean; error?: string } {
  const asString = typeof raw === "string" ? raw.trim() : String(raw);

  switch (column.type) {
    case "text": {
      if (column.maxLength && asString.length > column.maxLength) {
        return { error: `Supera el máximo de ${column.maxLength} caracteres` };
      }
      return { value: asString };
    }

    case "integer":
    case "decimal": {
      const num = parseNumericCell(typeof raw === "boolean" ? String(raw) : raw);
      if (num === null) return { error: `"${asString}" no es un número válido` };
      if (column.type === "integer" && !Number.isInteger(num)) {
        return { error: `"${asString}" tiene que ser un número entero` };
      }
      if (column.min !== undefined && num < column.min) {
        return { error: `Tiene que ser mayor o igual a ${column.min}` };
      }
      if (column.max !== undefined && num > column.max) {
        return { error: `Tiene que ser menor o igual a ${column.max}` };
      }
      // El precio se valida con `positive()` en Zod; adelantamos el mensaje acá
      // para que el preview lo muestre en el idioma del usuario.
      if (column.key === "price" && num <= 0) {
        return { error: "El precio tiene que ser mayor a 0" };
      }
      return { value: num };
    }

    case "enum": {
      const resolved = column.options?.[normalizeKey(asString)];
      if (!resolved) {
        return { error: `"${asString}" no es un valor válido. Opciones: ${column.hint ?? ""}` };
      }
      return { value: resolved };
    }

    case "boolean": {
      const parsed = parseBooleanCell(asString);
      if (parsed === null) return { error: `"${asString}" no es válido. Usá Sí o No` };
      return { value: parsed };
    }
  }
}

/**
 * Parsea una fila cruda del Excel (ya mapeada header -> valor) a datos tipados.
 *
 * No hace validación de negocio ni toca la DB: solo convierte y reporta lo que
 * no pudo interpretar. La validación autoritativa vive en el servidor.
 */
export function parseVehicleRow(
  rowNumber: number,
  raw: Record<string, string | number | boolean>
): ParsedRow {
  const data: Record<string, string | number | boolean> = {};
  const errors: RowIssue[] = [];
  const failedColumns = new Set<string>();

  for (const [header, cell] of Object.entries(raw)) {
    const column = COLUMN_BY_NORMALIZED_HEADER[normalizeKey(header)];
    // Columnas desconocidas se ignoran en silencio: el dealer suele dejar
    // columnas propias (notas internas, responsable) en su planilla.
    if (!column) continue;

    const isEmpty = typeof cell === "string" ? cell.trim() === "" : cell === null;
    if (isEmpty || cell === undefined) continue;

    const { value, error } = parseCell(column, cell);
    if (error) {
      errors.push({ column: column.header, message: error });
      failedColumns.add(column.key);
      continue;
    }
    if (value !== undefined) data[column.key] = value;
  }

  for (const column of VEHICLE_IMPORT_COLUMNS) {
    // Un obligatorio que falló al parsear NO está vacío: está mal cargado, y ya
    // tiene su error puntual. Reportarlo además como "vacío" contradice lo que
    // el dealer ve en su planilla.
    if (column.required && data[column.key] === undefined && !failedColumns.has(column.key)) {
      errors.push({ column: column.header, message: "Campo obligatorio vacío" });
    }
  }

  return { rowNumber, data, errors };
}
