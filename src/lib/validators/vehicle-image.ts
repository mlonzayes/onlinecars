import { z } from "zod";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_VEHICLE,
  type AllowedImageType,
} from "@/lib/constants";

export const imageOrderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(MAX_IMAGES_PER_VEHICLE),
});

// Detecta el tipo de imagen leyendo los magic numbers del buffer.
// No confiar solo en el header del navegador — es trivialmente falsificable.
export function detectImageMimeType(buffer: Buffer): AllowedImageType | null {
  if (buffer.length < 12) return null;

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

  // WebP: "RIFF" + 4 bytes + "WEBP"
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

export function getExtensionForMimeType(mime: AllowedImageType): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function isAllowedMimeType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}
