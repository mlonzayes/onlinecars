import { parseVehicleRow, type ParsedRow } from "./vehicle-row-parser";
import {
  COLUMN_BY_NORMALIZED_HEADER,
  MAX_IMPORT_ROWS,
  normalizeKey,
  VEHICLE_IMPORT_COLUMNS,
} from "./vehicle-columns";

/**
 * Lectura y escritura de planillas — SOLO cliente.
 *
 * ExcelJS se importa de forma dinámica para que no entre en el bundle del
 * dashboard: pesa cerca de 900KB y solo hace falta cuando el usuario abre el
 * diálogo de importación.
 */

/** Aplana los tipos de celda de ExcelJS a un primitivo usable. */
function cellToPrimitive(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) return value.toISOString();

  const obj = value as Record<string, unknown>;
  // Celda con fórmula: nos interesa el resultado calculado, no la fórmula.
  if ("result" in obj) return cellToPrimitive(obj.result);
  // Texto enriquecido: concatenamos los fragmentos.
  if ("richText" in obj && Array.isArray(obj.richText)) {
    return obj.richText.map((frag) => (frag as { text?: string }).text ?? "").join("");
  }
  if ("text" in obj) return cellToPrimitive(obj.text);
  return String(value);
}

export interface WorkbookReadResult {
  rows: ParsedRow[];
  /** Headers del archivo que no matchean ninguna columna conocida. */
  unknownHeaders: string[];
  /** True si el archivo tenía más filas que MAX_IMPORT_ROWS y se recortó. */
  truncated: boolean;
}

export async function readVehicleWorkbook(file: File): Promise<WorkbookReadResult> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("El archivo no tiene ninguna hoja de cálculo");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cellToPrimitive(cell.value) ?? "").trim();
  });

  if (headers.filter(Boolean).length === 0) {
    throw new Error("La primera fila tiene que contener los nombres de las columnas");
  }

  // Comparación normalizada: la plantilla marca los obligatorios con "*" y el
  // dealer puede cambiar acentos o mayúsculas al editar. Nada de eso invalida
  // la columna.
  const unknownHeaders = headers.filter(
    (h) => h && !COLUMN_BY_NORMALIZED_HEADER[normalizeKey(h)]
  );

  const rows: ParsedRow[] = [];
  let truncated = false;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rows.length >= MAX_IMPORT_ROWS) {
      truncated = true;
      return;
    }

    const raw: Record<string, string | number | boolean> = {};
    let hasContent = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      const value = cellToPrimitive(cell.value);
      if (value === null || value === "") return;
      raw[header] = value;
      hasContent = true;
    });

    // Filas totalmente vacías se ignoran sin reportar error: Excel arrastra
    // filas fantasma con formato pero sin datos todo el tiempo.
    if (!hasContent) return;
    rows.push(parseVehicleRow(rowNumber, raw));
  });

  return { rows, unknownHeaders, truncated };
}

/**
 * Genera y descarga la plantilla .xlsx.
 *
 * Lleva dos hojas: la de carga (headers + una fila de ejemplo) y una de
 * instrucciones con los valores aceptados por cada columna. Sin esto, el dealer
 * adivina los valores de los enums y la mitad de las filas rebota.
 */
export async function downloadVehicleTemplate(dealershipCurrency: string): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "motorflow";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Vehículos");
  sheet.columns = VEHICLE_IMPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: Math.max(col.header.length + 4, Math.min(col.example.length + 4, 40)),
  }));

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2F7" },
  };
  header.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Los obligatorios se marcan con asterisco, igual que en los forms del panel.
  VEHICLE_IMPORT_COLUMNS.forEach((col, index) => {
    if (col.required) {
      const cell = header.getCell(index + 1);
      cell.value = `${col.header} *`;
    }
  });

  const example = Object.fromEntries(
    VEHICLE_IMPORT_COLUMNS.map((col) => [
      col.key,
      col.key === "currency" ? dealershipCurrency : col.example,
    ])
  );
  const exampleRow = sheet.addRow(example);
  exampleRow.font = { italic: true, color: { argb: "FF7A7A7A" } };

  const guide = workbook.addWorksheet("Instrucciones");
  guide.columns = [
    { header: "Columna", key: "column", width: 24 },
    { header: "¿Obligatoria?", key: "required", width: 14 },
    { header: "Valores aceptados", key: "hint", width: 70 },
  ];
  guide.getRow(1).font = { bold: true };
  guide.addRow({
    column: "— Cómo usar —",
    required: "",
    hint: `Borrá la fila de ejemplo (en gris) y cargá un vehículo por fila. Máximo ${MAX_IMPORT_ROWS} por archivo. Los vehículos se importan como borrador: revisalos y publicalos desde el panel.`,
  });
  for (const col of VEHICLE_IMPORT_COLUMNS) {
    guide.addRow({
      column: col.header,
      required: col.required ? "Sí" : "No",
      hint: col.hint ?? "Texto libre",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-vehiculos.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}
