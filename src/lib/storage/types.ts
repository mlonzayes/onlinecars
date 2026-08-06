export interface UploadParams {
  buffer: Buffer;
  mimeType: string;
  // Subdirectorio dentro del root del provider, ej: "vehicles/clxabc123"
  keyPrefix: string;
  // Nombre del archivo final, ej: "uuid.jpg"
  filename: string;
}

export interface UploadResult {
  // URL para servir el archivo. Para imágenes (público) es la URL final que se
  // muestra al visitante. Para documentos del legajo (privado) es un valor
  // identificativo — no se usa directo desde el front; el front pide la URL
  // firmada vía getDocumentUrl.
  url: string;
  // Key interno del provider (necesario para borrar después y para firmar URLs).
  key: string;
}

// Parámetros del upload de documentos del legajo de venta.
// Conceptualmente equivalente a UploadParams — separado para que la abstracción
// refleje los dos casos de uso del producto: imágenes públicas vs documentos del legajo.
export interface UploadDocumentParams {
  buffer: Buffer;
  mimeType: string;
  // Subdirectorio dentro del root del provider, ej: "sales/clxabc123"
  keyPrefix: string;
  // Nombre del archivo final, ej: "uuid.pdf"
  filename: string;
}

// Indica a qué bucket pertenece un key. Necesario para drivers con
// almacenamiento separado público/privado (ej: S3 con dos buckets).
//   - "public":  imágenes del catálogo, assets del site builder del tenant.
//   - "private": documentos del legajo de venta (presigned URLs).
export type StorageBucket = "public" | "private";

// Parámetros para firmar una subida directa desde el browser al bucket público.
export interface CreateUploadUrlParams {
  keyPrefix: string;
  filename: string;
  mimeType: string;
  // Ventana de validez de la firma. Tiene que cubrir la subida completa desde
  // una conexión hogareña: 20MB a 3 Mbps son ~55s.
  ttlSeconds?: number;
}

export interface CreateUploadUrlResult {
  // URL firmada. El browser hace PUT acá con el archivo como body.
  uploadUrl: string;
  // Key final en el bucket — lo necesita el paso de confirmación.
  key: string;
  // URL pública definitiva del archivo una vez subido.
  publicUrl: string;
}

// Lo que devuelve una inspección de un objeto ya subido. Sirve para verificar
// SERVER-SIDE lo que el browser puso en el bucket, sin descargar el archivo
// entero: los primeros bytes alcanzan para el magic-number.
export interface ObjectProbe {
  sizeBytes: number;
  // Primeros bytes del objeto (para detectar el tipo real).
  head: Buffer;
}

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  /**
   * Firma una subida directa browser → bucket, salteando el servidor.
   *
   * Existe porque las funciones serverless de Vercel cortan el request body en
   * 4.5MB: un video de portada de 20MB NO puede pasar por un route handler.
   *
   * Devuelve null si el driver no soporta subida directa (el driver local) —
   * el caller cae al POST tradicional, que en dev funciona igual porque el
   * límite es de Vercel, no de Next.
   */
  createUploadUrl(params: CreateUploadUrlParams): Promise<CreateUploadUrlResult | null>;
  /**
   * Lee tamaño + primeros `headBytes` de un objeto del bucket público.
   * Se usa después de una subida directa para validar lo que realmente llegó.
   * Devuelve null si el objeto no existe.
   */
  probeObject(key: string, headBytes: number): Promise<ObjectProbe | null>;
  /**
   * URL pública final de un key del bucket público. El paso de confirmación la
   * DERIVA del key en vez de aceptarla del cliente — la URL termina guardada en
   * DB y servida a los visitantes; no puede venir de un input.
   */
  publicUrlFor(key: string): string;
  uploadDocument(params: UploadDocumentParams): Promise<UploadResult>;
  delete(key: string, bucket: StorageBucket): Promise<void>;
  // Devuelve una URL accesible para servir un documento del legajo (privado).
  // En S3 genera una presigned URL con expiración corta. En local devuelve la
  // URL pública directa. ttlSeconds aplica solo a drivers que firman.
  // downloadFilename (opcional): fuerza descarga (Content-Disposition attachment)
  // con ese nombre — evita que el browser renderice el doc inline.
  getDocumentUrl(
    key: string,
    ttlSeconds?: number,
    downloadFilename?: string,
  ): Promise<string>;
}
