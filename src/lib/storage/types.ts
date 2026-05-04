export interface UploadParams {
  buffer: Buffer;
  mimeType: string;
  // Subdirectorio dentro del root del provider, ej: "vehicles/clxabc123"
  keyPrefix: string;
  // Nombre del archivo final, ej: "uuid.jpg"
  filename: string;
}

export interface UploadResult {
  // URL pública para servir el archivo
  url: string;
  // Key interno del provider (necesario para borrar después)
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

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  uploadDocument(params: UploadDocumentParams): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
