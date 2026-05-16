import { z } from "zod";
import {
  MEDIA_PURPOSES,
  SECTION_TYPES,
  type AllowedVideoMimeType,
} from "../constants";

// Validadores para el endpoint de upload de medios del tenant site builder.
// La metadata viaja como campos en multipart/form-data junto con el archivo.

export const mediaPurposeSchema = z.enum(MEDIA_PURPOSES);
export const sectionTypeFieldSchema = z.enum(SECTION_TYPES);

export const mediaUploadMetadataSchema = z.object({
  sectionType: sectionTypeFieldSchema,
  purpose: mediaPurposeSchema,
}).strict().refine((data) => {
  // Cross-validate: purpose must match sectionType.
  // section_image es flexible — puede ir a cualquier sección.
  if (data.purpose === "hero_image" || data.purpose === "hero_video") return data.sectionType === "hero";
  if (data.purpose === "about_image") return data.sectionType === "about";
  if (data.purpose === "gallery_image") return data.sectionType === "gallery";
  return true;
}, { message: "El propósito del medio no coincide con el tipo de sección" });

// Reorder de la galería (ids en el nuevo orden).
export const mediaOrderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(20),
}).strict();

export type MediaUploadMetadata = z.infer<typeof mediaUploadMetadataSchema>;
export type MediaOrderInput = z.infer<typeof mediaOrderSchema>;

// Magic-number detection para video. Patrón espejado de `vehicle-image.ts`:
// no confiar en el header Content-Type del browser, es trivialmente falsificable.
export function detectVideoMimeType(buffer: ArrayBuffer): AllowedVideoMimeType | null {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  if (bytes.length < 12) return null;

  // MP4: bytes 4..7 son "ftyp" (varios brands después).
  if (
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70    // p
  ) {
    return "video/mp4";
  }

  // WebM: arranca con 0x1A 0x45 0xDF 0xA3 (EBML header).
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "video/webm";
  }

  return null;
}

// Re-export de la detección de imágenes (vive en vehicle-image.ts) para que los
// callers del tenant media usen un solo punto de entrada.
export { detectImageMimeType } from "./vehicle-image";
