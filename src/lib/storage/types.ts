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

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
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
