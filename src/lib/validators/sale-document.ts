import { z } from "zod";
import {
  ALLOWED_DOCUMENT_TYPES,
  SALE_DOCUMENT_CATEGORIES,
  type AllowedDocumentType,
} from "@/lib/constants";

// Schema para los metadatos que vienen junto con el archivo en el FormData.
// El "type" es texto libre — el front sugiere ejemplos en placeholder.
export const saleDocumentCreateSchema = z.object({
  category: z.enum(SALE_DOCUMENT_CATEGORIES),
  type: z
    .string()
    .min(1, "El tipo de documento es requerido")
    .max(100, "Máximo 100 caracteres"),
  notes: z.string().max(500).optional(),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export type SaleDocumentCreateInput = z.infer<typeof saleDocumentCreateSchema>;

// Detecta el mime real leyendo magic numbers. No confiar en el header del navegador
// — se puede falsificar trivialmente.
export function detectDocumentMimeType(buffer: Buffer): AllowedDocumentType | null {
  if (buffer.length < 12) return null;

  // PDF: %PDF- → 25 50 44 46 2D
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return "application/pdf";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // WebP: "RIFF" + 4 bytes de tamaño + "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function getExtensionForDocumentMime(mime: AllowedDocumentType): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function isAllowedDocumentMimeType(value: string): value is AllowedDocumentType {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(value);
}
