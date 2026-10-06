// Ancho permitido por next.config (images.imageSizes / deviceSizes). El
// optimizador de Next rechaza (400) cualquier `w` que no esté declarado.
type AllowedWidth = 64 | 128 | 256 | 384 | 640 | 828 | 1080 | 1920;

/**
 * URL de una imagen pasada por el optimizador de Next (`/_next/image`), para
 * los lugares donde no se puede usar <Image>: favicon, apple-icon, etc.
 *
 * Por qué: el favicon cae al logo del dealer cuando no subió uno, y hay logos
 * de 1,5 MB. Servido crudo se descargaba hasta 3 veces por visita (header,
 * favicon y apple-icon): casi 4,5 MB para un ícono de 32 px. El optimizador lo
 * redimensiona y negocia el formato con el `Accept` del cliente.
 */
export function optimizedImageUrl(src: string, width: AllowedWidth, quality: 75 | 90 = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
